# Task Force

Task Force is a task management application with a React client and an Express API. Organizations, employees, departments, resource permissions, and sessions use MongoDB. Account and organization features were adapted from [webpack-react-express-template](https://github.com/arunkumar413/webpack-react-express-template).

## Run locally

Requires Node.js 22 or newer and MongoDB (local or Atlas).

1. Copy `server/.env.example` to `server/.env`. Set `MONGODB_URI` and a random `SESSION_SECRET`.
2. Run `npm install` from the repository root.
3. Run `npm run dev`.

The client runs at http://localhost:3031 and proxies `/api` to the server at http://localhost:3000. The client defaults to a relative API URL; optionally configure `client/.env` using `client/.env.example`.

Build with `npm run build`. Run `NODE_ENV=production npm start` to serve the UI and API together. Production requires `SESSION_SECRET`; set `APP_ORIGIN` to the exact public HTTPS origin when needed for cross-origin access. `PORT` supports managed hosting, including Cloud Run source deployments using `gcp-build`.

## Demo task data

The client imports the 22 records in `server/dummyData/fakeTaskDataInsertIntoDB.js` directly. The adapter in `client/src/store/tasks.js` maps `due_date` to `dueDate`, adds stable demo IDs, and maps the original numeric creators to demo users. Original descriptions, statuses, priorities, and historical dates are preserved. Past dates appear under **Overdue**.

While signed out, tasks and saved views run in a clearly marked demo workspace and persist in browser local storage. They do not write to the organization database. Signing in loads the organization's MongoDB tasks; signing out returns to the demo workspace.

To seed the same dataset into MongoDB, run:

```sh
npm run seed:demo
```

**This command replaces the existing `acme` demo organization and its tasks, employees, views, departments, and role grants.** It leaves other organizations alone. The legacy `server/dummyData/InsertData.js` delegates to this MongoDB seeder.

Use organization slug `acme` and password `demo123`:

| Role | Email |
| --- | --- |
| Admin | ava.chen@acme.example |
| Manager | marcus.webb@acme.example |
| Employee | liam.ortiz@acme.example |
| HR | sam.okonkwo@acme.example |

The dataset's original creator IDs 1, 2, and 3 map to Ava, Marcus, and Liam respectively.

## Features

- Task creation, editing, deletion, search, priority/status filters, and due-date grouping.
- Markdown descriptions and comments, subtasks with completion state, labels, and HTTP(S) attachment links. Attachment file uploads are not implemented.
- Personal saved views with priority, status, label, and assignee filters.
- Organization registration, tenant-aware login, cookie sessions, and server-validated authentication on reload.
- Profiles, department and manager hierarchies, bulk employee invitations, and invite acceptance.
- Role/resource permission management and permission revocation on existing sessions.
- Multiple device sessions and OTP password changes that sign out other devices.
- Tailwind styling and light, dark, and system themes.
- All active screens use Tailwind utilities. Shared form controls live in `client/src/components/FormControls.jsx`; `client/src/index.css` contains only Tailwind setup and theme tokens.
- Structured request logging without authentication request bodies.

Configure `SMTP_URL` or `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` for invitation and password emails. Without SMTP, development codes are printed to the server console.

## Architecture and models

- `client/src/AppRouter.js`: task routes share the workspace layout; account/profile screens are loaded on demand.
- `client/src/store`: Redux authentication, API responses, tasks, and saved views. The task store selects the local demo or authenticated API.
- `server/index.js`: Express application, MongoDB sessions, account/organization routes, static client hosting, and JSON API errors.
- `server/routes/router.js`: task and saved-view routes with authentication and resource/action authorization.
- `server/models`: Mongoose models for Organization, Department, Employee, Role, RoleAssignment, Resource, Permission, AuthSession, PasswordOtp, Todo, and TaskView.

`Todo` represents a Task Force task: tenant, creator, assignee, title, description, due date, priority, status, labels, embedded comments, attachment links, and subtasks. Supported statuses are Pending, In progress, Done, Backlog, and Cancelled; priorities are Low, Medium, High, and Urgent.

All task queries are scoped to the signed-in tenant. Administrators can access organization tasks; other employees can access tasks assigned to themselves or their reports, and tasks they created. Assignments can target any active employee in that tenant. Create and edit forms search the organization directory by name, email, or username. Resource permissions independently control each action.

Email changes require the current password and rotate the session while invalidating outstanding verification codes. Authentication limits use shared MongoDB counters over 15-minute fixed windows: 10 login attempts per normalized email, 100 per client IP, 20 registrations per IP, and 10 profile updates per employee. Successful attempts count toward these limits. Exceeded limits return HTTP 429 with `Retry-After`. In production, configure the trusted reverse proxy to strip client-supplied forwarded headers and supply the real client IP.

Saved views belong to a tenant and employee. MongoDB sessions are stored separately from device-session metadata; passwords and OTPs are hashed. There is no PostgreSQL dependency. Existing PostgreSQL records are not automatically migrated.

## Task API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET / POST | `/api/tasks` | List accessible tasks / create a task |
| GET / PATCH / DELETE | `/api/tasks/:taskId` | Read / update / delete a task |
| POST | `/api/tasks/:taskId/comments` | Add a comment |
| GET | `/api/mytasks` | Tasks assigned to the current employee |
| GET | `/api/task-data/:taskId` | Compatibility alias for task detail |
| GET / POST | `/api/views` | List / create personal saved views |

Task and view responses use `{ data: ... }`; errors use `{ statusMessage: ... }`. Include session cookies for authenticated API requests. The client API helper additionally stores account/organization responses in Redux under `state.api[key]`.

## Validation

`npm test` runs API integration tests against an isolated temporary MongoDB instance using mongodb-memory-server. The first run may download its MongoDB binary. Tests cover registration, sessions, permissions, tenant boundaries, task persistence and validation, invitations, saved views, password changes, and the supplied dataset.

`npm run build` validates and builds the production client.

For browser tests, run `npx playwright install chromium --only-shell`, then `npm run build` and `npm run test:ui`. Playwright starts a separate app on port 3040 with a temporary MongoDB database and seeded demo accounts.
