# TaskFlow

A production-shaped project & task management app — think a lightweight Linear/Asana. Built to demonstrate a real full-stack engineering setup: typed end to end, secure auth with refresh-token rotation, role-based access, and an analytics dashboard backed by real MongoDB aggregations.

**Stack:** React + TypeScript + Vite + Tailwind · Node.js + Express + TypeScript (MVC) · MongoDB + Mongoose · JWT access + rotating refresh tokens · React Query · Recharts · Jest + Supertest.
 
```
taskflow/
├── backend/          Express API (MVC, TypeScript)
├── frontend/          React SPA (Vite, TypeScript, Tailwind)
├── ARCHITECTURE.md    Design decisions & interview talking points
├── DEPLOYMENT.md      Deploying to Render + Vercel
└── README.md          You are here
```

## Features

- **Auth**: signup/login/logout, bcrypt-hashed passwords, short-lived JWT access tokens kept in memory on the client, long-lived opaque refresh tokens stored server-side and rotated on every use, delivered via an `httpOnly` cookie.
- **Roles**: `user` and `admin`. Admins see all data across the org and can manage users; regular users only see their own projects/tasks.
- **CRUD**: full lifecycle for Projects and Tasks, with ownership checks.
- **Search / filter / sort / pagination**: server-side, on the tasks list (`?search=&status=&priority=&project=&sort=&page=&limit=`).
- **Dashboard**: totals, overdue count, tasks-by-status and tasks-by-priority breakdowns, and a 7-day creation trend, all computed with MongoDB aggregation pipelines and scoped by role.
- **Validation**: `zod` schemas on the backend (single source of truth for shape + error messages), `react-hook-form` on the frontend for instant feedback.
- **Error handling**: a single `ApiError` class + centralized error middleware; the frontend surfaces API error messages via toasts.
- **Loading & empty states**: every list/table has a skeleton/spinner state and a designed empty state, not a blank screen.
- **API docs**: Swagger UI served at `/api/docs`.
- **Tests**: Jest + Supertest + `mongodb-memory-server` against the real Express app and Mongoose models (not mocked).

## Quick start

Prerequisites: Node 18+, and either a local MongoDB instance or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster.

```bash
# 1. Backend
cd backend
cp .env.example .env        # fill in MONGO_URI and JWT secrets
npm install
npm run dev                  # http://localhost:5000, docs at /api/docs

# 2. Frontend (new terminal)
cd frontend
cp .env.example .env         # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                   # http://localhost:5173
```

Sign up for an account from the UI — the first account you create is a normal `user`. To try the admin views, promote it directly in Mongo:

```js
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

## Running tests

```bash
cd backend
npm test
```

Tests spin up an in-memory MongoDB instance (`mongodb-memory-server`), so no real database connection is needed — but the test runner does need internet access the first time to download the `mongod` binary. In network-restricted environments (like the sandbox this was built in), pre-warm the binary cache or point `mongodb-memory-server` at a pre-downloaded binary via `MONGOMS_SYSTEM_BINARY`.

## Environment variables

**backend/.env**

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Separate signing secrets (never reuse one for both) |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | e.g. `15m` / `7d` |
| `CLIENT_URL` | Origin allowed by CORS + where cookies are scoped |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | API rate limiting |

**frontend/.env**

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the API, e.g. `http://localhost:5000/api` |

See `DEPLOYMENT.md` for production deployment (Render + Vercel) and `ARCHITECTURE.md` for the design rationale behind these choices.
