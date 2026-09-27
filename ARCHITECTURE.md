# Architecture & Design Decisions

This is written the way I'd walk an interviewer through the codebase: what I built, and — more importantly — *why*, including the trade-offs I made on purpose.

## 1. Authentication: JWT access token + rotating opaque refresh token

**The problem with the naive approach.** A lot of tutorials put a single long-lived JWT in `localStorage`. That's two mistakes stacked: `localStorage` is readable by any JS on the page, so it's directly exposed to XSS; and a single long-lived token can't be revoked — if it leaks, it's valid until it expires, full stop.

**What this does instead:**
- The **access token** is a short-lived (15 min) JWT, kept only in memory on the client (a module-level variable in `lib/axios.ts`, not `localStorage`/`sessionStorage`). It never touches disk on the client. If an XSS bug ever leaked it, the blast radius is 15 minutes.
- The **refresh token** is a long-lived (7 day), opaque, randomly generated string (`crypto.randomBytes(64)`) — not a JWT. It's stored server-side in a `RefreshToken` collection (so it can be looked up, revoked, or rotated) and delivered to the browser only as an `httpOnly`, `Secure`, `SameSite` cookie scoped to `/api/auth`. JS on the page can never read it.
- **Rotation**: every time `/api/auth/refresh` is called, the old refresh token is marked `revoked` and a brand-new one is issued and set as the new cookie. This means a stolen refresh token is a single-use liability, not a standing one — if the legitimate user refreshes again first, the attacker's copy is already dead. (A production system would go further and detect *reuse* of a revoked token as a signal of theft and kill the whole token family; I called that out as a natural next step rather than building it, to keep scope honest.)
- On page load, the SPA doesn't know if it's logged in — it just calls `/auth/refresh` immediately. If the cookie is valid, it gets a fresh access token and fetches `/auth/me`; if not, it renders logged out. That's why reloading the page doesn't log you out, without ever storing anything sensitive in the browser's persistent storage.
- The axios response interceptor catches a `401`, queues any other in-flight requests, fires a single `/auth/refresh`, and replays everything once it resolves — so a page that fires five parallel requests right as the access token expires doesn't trigger five redundant refresh calls.

## 2. Backend structure: MVC, but pragmatic about it

```
routes/       → just wires HTTP verbs+paths to controllers, plus middleware order
controllers/  → HTTP-shape concerns: parse req, call the model/service, shape the response
services/     → auth.service and token.service hold logic that's genuinely reusable /
                testable independent of Express (issuing tokens, hashing checks)
models/       → Mongoose schemas *and* their invariants (password hashing lives in a
                pre('save') hook on the User model, not scattered in controllers)
middleware/   → auth, role checks, validation, centralized error handling
validations/  → zod schemas — one definition of "what a valid task looks like" shared
                by the request validator and (via inference) usable for types
```

I didn't introduce a separate repository/data-access layer on top of Mongoose — for a Mongoose-based API, the model *is* the data-access layer, and adding another abstraction on top of it for a project this size would be indirection without payoff. I'd introduce one if this were sitting on a less ergonomic driver, or if we needed to swap persistence layers, which is not a real constraint here.

## 3. Error handling: one shape, one path

Every thrown error becomes an `ApiError` with a status code and message (`ApiError.notFound(...)`, `ApiError.conflict(...)`, etc.), and every route handler is wrapped in `asyncHandler` so a rejected promise reaches Express's error pipeline instead of crashing the process or hanging the request. One `errorHandler` middleware at the bottom of the stack is the only place that decides what an error response looks like — including hiding stack traces in production but showing them in development. The frontend never has to guess the shape of an error response; it's `{ success: false, message, details? }` everywhere.

## 4. Validation: zod on the backend, react-hook-form on the frontend — deliberately not shared

I considered sharing zod schemas between frontend and backend (a monorepo/shared-package approach). I didn't, for a concrete reason: frontend validation is about UX (tell the user *now*, inline, which field is wrong), and backend validation is a security boundary (never trust the client, full stop, even if the UI is well-behaved). Coupling them means a UI-only tweak (e.g., "let this field be optional in the form because we default it") risks quietly loosening the server's guarantee, or vice versa. They express the same intent but for different audiences, so I kept them independent and let them drift if the two concerns ever diverge.

## 5. Task visibility vs. dashboard scoping — an intentional asymmetry

Tasks and projects are visible to **all authenticated users** — this is modeled as a shared team workspace, like Linear or Asana, not a per-user silo. The **dashboard**, on the other hand, scopes its aggregations to `createdBy: currentUser` for regular users and shows org-wide numbers only for admins. That's not an inconsistency; it's two different questions: "what can I *act on*" (shared, collaborative) vs. "what does *my* contribution look like" (personal, unless you're an admin who needs the org-wide view). I'd flag this explicitly in a real PR description so a reviewer doesn't mistake it for a missed access check.

## 6. Search, filter, sort, pagination — all server-side

All of it happens in the MongoDB query (`listTasks` in `task.controller.ts`), not by fetching everything and filtering in JS. `search` uses a MongoDB text index (`$text`) on the Task model rather than a regex scan, `sort` accepts a comma-separated field list with `-` for descending (matching a convention a lot of REST APIs use), and pagination returns `{ page, limit, total, totalPages }` so the frontend never has to compute those itself. This is the part of the system most directly tied to real-world scale: it's the difference between an API that stays flat as data grows and one that falls over at a few thousand rows.

## 7. Dashboard analytics via aggregation pipelines, not application code

`byStatus`, `byPriority`, and the 7-day trend line are computed with `Task.aggregate([...])` — `$group`, `$match`, `$dateToString` — rather than pulling every task into Node and reducing it in JavaScript. This pushes the computation to the database, which is both faster and correct as data grows (the amount of data transferred is O(distinct buckets), not O(rows)).

## 8. Why React Query instead of Redux/Context for server state

Almost everything in this app *is* server state (tasks, projects, users, dashboard numbers) — React Query gives caching, background refetching, and mutation-driven invalidation (`invalidateQueries(['tasks'])` after a create/update/delete) for free, which is exactly the boilerplate Redux would otherwise need thunks/sagas for. `AuthContext` is deliberately kept as plain React context, because auth is genuinely client state (who is currently acting), not server state that needs caching semantics.

## 9. Trade-offs I made explicitly, and would revisit given more time

- **No refresh-token-reuse detection.** Rotation is implemented; theft *detection* (killing a whole token family on reuse of a revoked token) is not. I'd add it before shipping this for real.
- **No E2E tests** (Playwright/Cypress) — only backend integration tests with Supertest + an in-memory Mongo. Given a time box, I prioritized proving the API contract over UI regression coverage.
- **Single JS bundle on the frontend** (Vite flags it at ~230KB gzipped). I'd add route-based code splitting (`React.lazy`) before this went to real users, especially for the charting library, which is the heaviest dependency.
- **No file uploads / attachments on tasks.** Out of scope for the brief; would need object storage (S3-compatible) plus signed URLs if added.
- **Text search is a MongoDB `$text` index**, not something like Atlas Search/Elasticsearch. Fine at this scale; I'd revisit it if search needed typo-tolerance or ranking beyond MongoDB's default.
