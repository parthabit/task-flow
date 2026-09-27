# Database Schema (MongoDB / Mongoose)

Four collections. Full definitions live in `backend/src/models/*.model.ts`; this is the reference view.

## `users`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `name` | String | required, max 80 chars |
| `email` | String | required, unique, lowercased, regex-validated |
| `password` | String | required, min 8 chars, bcrypt-hashed in a `pre('save')` hook, `select: false` (never returned by default) |
| `role` | `'user' \| 'admin'` | default `'user'` |
| `avatarColor` | String | assigned randomly at creation, used for UI initials avatars |
| `createdAt` / `updatedAt` | Date | via `timestamps: true` |

`toJSON` is overridden to strip `password` and `__v` even if a query accidentally re-selects the password field.

## `projects`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `name` | String | required, max 120 chars, text-indexed |
| `description` | String | optional, max 1000 chars, text-indexed |
| `color` | String | hex color for UI |
| `owner` | ObjectId → `users` | required, indexed |
| `members` | ObjectId[] → `users` | |
| `createdAt` / `updatedAt` | Date | |

## `tasks`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `title` | String | required, max 160 chars, text-indexed |
| `description` | String | optional, max 2000 chars, text-indexed |
| `status` | `'todo' \| 'in_progress' \| 'in_review' \| 'done'` | default `'todo'`, indexed |
| `priority` | `'low' \| 'medium' \| 'high' \| 'urgent'` | default `'medium'`, indexed |
| `dueDate` | Date | optional |
| `project` | ObjectId → `projects` | required, indexed |
| `assignee` | ObjectId → `users` | optional |
| `createdBy` | ObjectId → `users` | required — set server-side from the auth token, never trusted from the request body |
| `createdAt` / `updatedAt` | Date | |

Indexes: a compound `{ project: 1, status: 1 }` for the common "tasks in this project by status" query, plus a text index on `title` + `description` for the search box.

## `refreshtokens`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `user` | ObjectId → `users` | required, indexed |
| `token` | String | required, unique — a random 128-char hex string, not a JWT |
| `expiresAt` | Date | required. **TTL index** (`expireAfterSeconds: 0`) — MongoDB deletes the document automatically once this passes, so expired tokens don't need a cron job to clean up |
| `revoked` | Boolean | default `false`; set `true` the moment a token is rotated or the user logs out |
| `createdAt` | Date | |

## Entity relationship

```
users 1───* projects        (owner)
users *───* projects        (members)
users 1───* tasks           (createdBy)
users 0..1─* tasks          (assignee)
projects 1─* tasks          (project)
users 1───* refreshtokens   (user)
```

## Why Mongoose over a relational schema here

The domain is document-shaped and doesn't need multi-table transactions: a task always belongs to exactly one project and is read far more often than the relationships between projects change. Foreign keys are modeled as `ObjectId` refs and resolved with `.populate()` at read time — the standard Mongoose pattern, equivalent to a `JOIN` but resolved application-side. If this app grew reporting requirements heavier than the current aggregation pipelines comfortably handle, that would be the trigger to introduce a read-replica or a proper OLAP store rather than to switch the core schema to relational.
