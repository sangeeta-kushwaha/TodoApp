# Taskboard

Taskboard is a personal task manager. You sign up, log in, and manage only your own tasks. Each task has a title, description, priority, status, and optional due date.

This repository keeps the React frontend and the Express API in separate folders. The browser never stores access or refresh tokens in `localStorage`.

## Features

- Sign up, log in, log out, and restore a session after refresh
- Create, read, update, and delete tasks
- Mark a task complete or incomplete
- Priority: Low, Medium, High
- Status: Pending, In Progress, Completed
- Due dates, with an overdue badge for open tasks whose due date is before today
- Dashboard counts calculated from the signed-in user's tasks
- Search, status filter, priority filter, sorting, and server-side pagination
- Field validation, loading skeletons, empty and error states, toasts, and a delete confirmation
- Light and dark mode
- Users can only read or change their own tasks

## Tech stack

- Frontend: React, Vite, Tailwind CSS, React Router, Axios
- Backend: Node.js, Express, MongoDB, Mongoose
- Auth: bcrypt password hashes, JWT access and refresh tokens in HttpOnly cookies
- Validation: Zod

## Architecture

The React app is a single-page application. Protected pages sit inside one shell: a sidebar on desktop, a menu button on small screens, and a header with the page title, theme toggle, profile, and log out.

`AuthContext` asks the API who the current user is. `TasksContext` loads dashboard counts and the five newest tasks. The task list asks the API for one page at a time. Pages do not call Axios directly.

The Express app is created in `backend/src/app.js`. `backend/server.js` loads environment variables, checks the JWT secrets, connects to MongoDB, and starts listening. Tests import the app without starting the server or touching your development database.

```text
authapp/
├── backend/
│   ├── server.js
│   ├── src/
│   │   ├── app.js
│   │   ├── config/db.js
│   │   ├── constants/tasks.js
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── utils/
│   └── tests/
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── constants/
    │   ├── context/
    │   ├── pages/
    │   ├── routes/
    │   ├── services/api.js
    │   └── utils/
    └── vitest.config.js
```

## Prerequisites

- Node.js 20 or newer
- MongoDB running locally, or any MongoDB connection string

## Installation

```bash
cd backend
cp .env.example .env
npm install

cd ../frontend
cp .env.example .env
npm install
```

Edit `backend/.env` and replace both JWT placeholders with long, different random strings. Do not commit `.env`.

## Environment variables

### Backend (`backend/.env`)

| Variable | Purpose |
| --- | --- |
| `PORT` | API port. Default `8080`. |
| `MONGO_URI` | MongoDB connection string. |
| `CLIENT_URL` | Frontend origin allowed by CORS. Use `http://localhost:5173` for local development. |
| `JWT_SECRET` | Secret for 15-minute access tokens. |
| `JWT_REFRESH_SECRET` | Different secret for 7-day refresh tokens. |
| `NODE_ENV` | `development` or `production`. |
| `COOKIE_SECURE` | `false` on local HTTP. `true` on HTTPS. |
| `COOKIE_SAMESITE` | `lax` when the site and API share a site. `none` only for separate HTTPS sites. |

### Frontend (`frontend/.env`)

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | `/api` when using the Vite dev server. Use `http://localhost:8080/api` if the built app calls the API directly. |

## Database

The app uses two collections: `users` and `todos`. Mongoose creates them on first use. Starting the API also creates an index on tasks for `user` and `createdAt`. That does not delete existing documents.

Older tasks may not have `priority`, `status`, or `dueDate`. The API fills those in the response: priority `medium`, and status `completed` or `pending` based on the old `completed` flag. Editing the task saves the new fields.

## Commands

Run the API and the frontend in two terminals.

```bash
# API with restart on file changes
cd backend
npm run dev

# API without nodemon
npm start

# Frontend
cd frontend
npm run dev
```

Open `http://localhost:5173`. The dev server proxies `/api` to `http://localhost:8080`, so the browser talks to one origin and can store the cookies.

```bash
cd frontend
npm test
npm run lint
npm run build

cd ../backend
npm test
```

## API

The base path is `/api`. Browser requests send cookies. State-changing browser requests also send `X-CSRF-Token`, copied from the readable `csrfToken` cookie.

Successful task responses look like `{ success, message, data }`. Auth responses look like `{ message, user }` and do not include tokens.

### Auth

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/signup` | Public | Create an account. `name`, `email`, `password`. |
| `POST` | `/api/auth/login` | Public | Check the password and set cookies. |
| `GET` | `/api/auth/me` | Access cookie or Bearer token | Return the current user. |
| `POST` | `/api/auth/refresh` | Refresh cookie plus CSRF, or a refresh token in the JSON body | Rotate the session. |
| `POST` | `/api/auth/logout` | CSRF when using cookies | Clear cookies and revoke the refresh token. |

Signup and login are limited to 10 attempts per 15 minutes per IP. The limiter lives in process memory.

### Tasks

All task routes require an access cookie or `Authorization: Bearer <access token>`.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/todo/stats` | Counts for the signed-in user: total, completed, pending, in progress, and overdue. |
| `GET` | `/api/todo` | One page of the signed-in user's tasks. |
| `POST` | `/api/todo` | Create a task. |
| `PUT` | `/api/todo/:id` | Update the signed-in user's task. The body may be partial. |
| `DELETE` | `/api/todo/:id` | Delete the signed-in user's task. |

Create body:

```json
{
  "title": "Write tests",
  "description": "Cover auth and ownership",
  "priority": "high",
  "status": "pending",
  "dueDate": "2026-10-21"
}
```

`priority` is `low`, `medium`, or `high`. `status` is `pending`, `in_progress`, or `completed`. `dueDate` is `YYYY-MM-DD` or `null`. Sending `completed: true` without a status marks the task completed. Sending `completed: false` sets the status back to `pending`.

List query parameters:

| Param | Default | Values |
| --- | --- | --- |
| `q` | empty | Search title and description. Max 100 characters. |
| `status` | `all` | `all`, `open`, `pending`, `in_progress`, `completed`, `overdue` |
| `priority` | `all` | `all`, `low`, `medium`, `high` |
| `sort` | `newest` | `newest`, `oldest`, `due`, `priority`, `title` |
| `page` | `1` | A page past the end returns the last page. |
| `limit` | `8` | `1` to `50`. |

`open` means not completed. `overdue` means the due date is before today and the task is still open. `medium` also matches older tasks that have no priority saved. An unknown filter returns `400`.

The list response adds `meta`: `{ page, limit, total, pageCount, start, end }`. `data` is only that page. The task list page stores `q`, `status`, `priority`, `sort`, and `page` in the URL.

A missing or unknown task id for another user returns `404`, so the API does not reveal that the task exists. An invalid id returns `400`.

### Cookie session with curl

```bash
curl -c cookies.txt -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"secret12"}'

# Copy the csrfToken value from cookies.txt into the header.
curl -b cookies.txt -X POST http://localhost:8080/api/todo \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: PASTE_CSRF_TOKEN" \
  -d '{"title":"Write tests","description":"Cover auth and ownership"}'
```

A script that already has an access token can send `Authorization: Bearer <token>` and skip the CSRF header. The login response does not include that token. The supported browser flow is the cookie session.

## Security notes

Passwords are hashed with bcrypt and are not returned by the API. Access tokens last 15 minutes and refresh tokens last 7 days. Both are HttpOnly. The refresh token is stored only as a SHA-256 hash. Each refresh issues a new refresh token. If an old refresh token is presented again, the server revokes the session.

The readable cookies are not credentials. `loggedIn` only tells the interface to check the session. `csrfToken` is compared with the `X-CSRF-Token` header on cookie-authenticated changes. `SameSite=Lax` blocks most cross-site posts. Use HTTPS and `COOKIE_SECURE=true` in production. If the frontend and API are on different sites, set `COOKIE_SAMESITE=none` and serve both over HTTPS. The simpler deployment is one site, with the API under `/api`.

Login failures use the same `401` message for an unknown email and a wrong password. Signup, login, and task bodies are validated with Zod. The API does not send internal error details to the client. React renders task text as text, not HTML.

The previous version stored both tokens in `localStorage` and did not call the refresh route. JavaScript on the page could read those tokens. HttpOnly cookies remove that path. The tradeoff is that the browser attaches cookies automatically, so cookie-authenticated changes need CSRF protection. Both sides were changed together.

## Testing

Backend tests use Node's built-in test runner, Supertest, and a temporary in-memory MongoDB. They do not connect to `MONGO_URI`.

Frontend tests use Vitest. They cover task stats, overdue rules, filtering, sorting, pagination, form validation, and the empty login form.

Latest local run:

- `backend`: `npm test` — 20 tests passed
- `frontend`: `npm test` — 6 tests passed
- `frontend`: `npm run lint` — passed
- `frontend`: `npm run build` — passed

The UI was not clicked through in a browser during this pass. The production build was produced, but the dev server flow was not exercised by hand.

## Completed features

- Account signup, login, logout, current user, and refresh-token rotation
- Task create, list, update, complete toggle, and delete
- Priority, status, due date, and overdue display
- Dashboard counts from real tasks
- Search, filters, sorting, and pagination in the browser
- Validation, loading, empty, error, toast, and delete confirmation states
- Light and dark mode
- Ownership checks and HttpOnly cookie sessions

## Known limitations

- Search still scans that user's titles and descriptions with a case-insensitive match. It is fine for a personal list, and it will get slower than an indexed text search if one account stores a very large number of tasks.
- The rate limiter resets when the API process restarts and is not shared across multiple servers.
- There is no email verification or password reset.
- Marking a completed task incomplete sets the status to Pending, not In Progress.
- Dark mode is stored in this browser only.
- There is no automated browser test of the full click path.

## Interview explanation

Taskboard is a small full-stack app I can walk through end to end. The interesting part is how a user stays signed in without putting tokens where page scripts can read them.

I kept access tokens short, 15 minutes, and refresh tokens longer, 7 days. The refresh token is hashed in MongoDB and rotated on every refresh. Reusing an old refresh token revokes the session. Every task query includes the user id from the verified access token, so one user cannot edit another user's task by guessing an id.

The hard part was cookies across the Vite app and the API. In development, Vite proxies `/api`, so the browser sees one origin and `SameSite=Lax` cookies work. Cookie requests then need a CSRF check, because the browser would otherwise send the cookie on a forged request. Bearer tokens remain available for tests and scripts that are not browsers.

Search, filters, sorting, and pages run in MongoDB. The dashboard counts come from a separate aggregate, so the home page does not download every task. I would next move rate limiting to a shared store and add password reset. I would not add those until the current session and ownership rules stay covered by tests.

## License

ISC
