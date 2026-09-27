import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('Auth', () => {
  const credentials = { name: 'Ada Lovelace', email: 'ada@example.com', password: 'supersecret123' };

  it('signs up a new user and returns an access token', async () => {
    const res = await request(app).post('/api/auth/signup').send(credentials);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe(credentials.email);
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('rejects signup with a duplicate email', async () => {
    await request(app).post('/api/auth/signup').send(credentials);
    const res = await request(app).post('/api/auth/signup').send(credentials);
    expect(res.status).toBe(409);
  });

  it('rejects signup with an invalid payload', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'A', email: 'not-an-email', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.details).toBeInstanceOf(Array);
  });

  it('logs in with correct credentials and rejects wrong ones', async () => {
    await request(app).post('/api/auth/signup').send(credentials);

    const good = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password });
    expect(good.status).toBe(200);
    expect(good.body.data.accessToken).toBeDefined();

    const bad = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'wrongpassword' });
    expect(bad.status).toBe(401);
  });

  it('blocks /me without a token and allows it with one', async () => {
    const signupRes = await request(app).post('/api/auth/signup').send(credentials);
    const token = signupRes.body.data.accessToken;

    const unauthorized = await request(app).get('/api/auth/me');
    expect(unauthorized.status).toBe(401);

    const authorized = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(authorized.status).toBe(200);
    expect(authorized.body.data.email).toBe(credentials.email);
  });

  it('rotates the refresh token cookie on /refresh and logs out cleanly', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/signup').send(credentials);

    const refreshed = await agent.post('/api/auth/refresh');
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.data.accessToken).toBeDefined();

    const loggedOut = await agent.post('/api/auth/logout');
    expect(loggedOut.status).toBe(200);

    const afterLogout = await agent.post('/api/auth/refresh');
    expect(afterLogout.status).toBe(401);
  });
});
