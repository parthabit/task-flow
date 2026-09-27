import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

async function signupAndGetToken(email = 'owner@example.com') {
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ name: 'Owner', email, password: 'supersecret123' });
  return res.body.data.accessToken as string;
}

async function createProject(token: string) {
  const res = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Website Redesign', description: 'Q4 marketing site revamp' });
  return res.body.data._id as string;
}

describe('Tasks CRUD + search/filter/pagination', () => {
  it('creates, reads, updates and deletes a task', async () => {
    const token = await signupAndGetToken();
    const projectId = await createProject(token);

    const create = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Design homepage hero', project: projectId, priority: 'high' });
    expect(create.status).toBe(201);
    const taskId = create.body.data._id;

    const get = await request(app).get(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${token}`);
    expect(get.status).toBe(200);
    expect(get.body.data.title).toBe('Design homepage hero');

    const update = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'in_progress' });
    expect(update.status).toBe(200);
    expect(update.body.data.status).toBe('in_progress');

    const del = await request(app).delete(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);

    const getAfterDelete = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getAfterDelete.status).toBe(404);
  });

  it('filters tasks by status and paginates results', async () => {
    const token = await signupAndGetToken('pm@example.com');
    const projectId = await createProject(token);

    for (let i = 0; i < 15; i++) {
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: `Task ${i}`,
          project: projectId,
          status: i % 3 === 0 ? 'done' : 'todo',
        });
    }

    const page1 = await request(app)
      .get('/api/tasks?status=todo&page=1&limit=5')
      .set('Authorization', `Bearer ${token}`);

    expect(page1.status).toBe(200);
    expect(page1.body.data.length).toBe(5);
    expect(page1.body.pagination.total).toBe(10); // 15 tasks, 5 are 'done' (i % 3 === 0)
    expect(page1.body.pagination.totalPages).toBe(2);
  });

  it('rejects task creation without an auth token', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'No auth', project: 'x' });
    expect(res.status).toBe(401);
  });
});
