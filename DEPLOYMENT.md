# Deployment Guide

Target setup: **backend on Render**, **frontend on Vercel**, **database on MongoDB Atlas**. This is a cross-origin deployment (different domains for API and SPA), which is why the auth cookie logic checks `env.isProd` to switch between `sameSite: 'lax'` (local dev, same-site) and `sameSite: 'none'; secure: true` (prod, cross-site) — a cookie can't be sent cross-origin without both of those in production, and browsers will silently drop it if you forget.

## 1. Database — MongoDB Atlas

1. Create a free (M0) cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Database Access → add a user with a strong password.
3. Network Access → allow access from anywhere (`0.0.0.0/0`) for simplicity, or Render's static outbound IPs if you're on a paid Render plan.
4. Copy the connection string: `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/taskflow?retryWrites=true&w=majority`.

## 2. Backend — Render

1. Push this repo to GitHub.
2. In Render: **New → Web Service**, connect the repo, set **Root Directory** to `backend`.
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add environment variables (Render dashboard → Environment):
   - `NODE_ENV=production`
   - `MONGO_URI` — the Atlas connection string
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — long random strings (`openssl rand -hex 32`)
   - `JWT_ACCESS_EXPIRES_IN=15m`, `JWT_REFRESH_EXPIRES_IN=7d`
   - `CLIENT_URL` — your Vercel URL, e.g. `https://taskflow.vercel.app` (no trailing slash — it's matched exactly by CORS)
   - `RATE_LIMIT_WINDOW_MS=900000`, `RATE_LIMIT_MAX=200`
6. Deploy. Render gives you a URL like `https://taskflow-api.onrender.com`. Confirm it's up: `GET https://taskflow-api.onrender.com/health` and check `/api/docs` for the Swagger UI.

Note: Render's free tier spins down on idle, so the first request after inactivity takes a few seconds — expected, not a bug.

## 3. Frontend — Vercel

1. In Vercel: **New Project**, import the same repo, set **Root Directory** to `frontend`.
2. Framework preset: Vite (auto-detected). Build command `npm run build`, output directory `dist`.
3. Environment variable:
   - `VITE_API_URL=https://taskflow-api.onrender.com/api`
4. Deploy. Vercel gives you `https://taskflow.vercel.app`.
5. Go back to Render and make sure `CLIENT_URL` matches this URL exactly, then redeploy the backend so CORS picks it up.

## 4. Smoke test

- Visit the Vercel URL, sign up, and confirm you land on `/dashboard`.
- Reload the page — you should stay logged in (the silent `/auth/refresh` call on mount uses the httpOnly cookie).
- Open dev tools → Application → Cookies and confirm `refreshToken` is `Secure`, `HttpOnly`, `SameSite=None`, scoped to `/api/auth`.
- Log out, then try refreshing — you should be redirected to `/login`.

## CI (optional)

A minimal GitHub Actions workflow for the backend:

```yaml
name: backend-ci
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 18 }
      - run: npm install
      - run: npm run build
      - run: npm test
```

## Alternative: single-host deployment

If you'd rather avoid cross-origin cookies entirely, serve the built frontend as static files from the Express app (`app.use(express.static(...))` + a catch-all route to `index.html`) and deploy the whole thing as one Render web service. Then `sameSite: 'lax'` works in production too since everything is same-site. This trades deployment simplicity for losing Vercel's edge CDN for the frontend.
