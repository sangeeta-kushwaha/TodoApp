# Taskboard

Taskboard is a personal task manager. A person signs up, logs in, and works only with their own tasks. A task has a title, description, priority, status, and an optional due date.

The repository is two apps in one folder:

- `frontend` is the React site. In development it runs at `http://localhost:5173`.
- `backend` is the Express API. In development it runs at `http://localhost:8080`.

The browser never talks to MongoDB. It only talks to the API. The API is the only part that reads and writes the database.

## What a person can do

- Sign up, log in, log out, and stay signed in after a refresh
- Create, edit, complete, and delete tasks
- Set priority to Low, Medium, or High
- Set status to Pending, In Progress, or Completed
- Add a due date, and see an overdue badge when an open task is past that date
- See dashboard counts for every saved task, plus the five newest tasks
- Search, filter, sort, and page through tasks
- Switch between light and dark mode

Search, filters, sorting, and pages happen in MongoDB. The browser asks for one page at a time. It does not download the whole list and then filter it.

## How the pieces connect

```text
Browser (React, port 5173)
        |
        |  /api/...   cookies go with the request
        v
Vite dev server proxies /api to port 8080
        |
        v
Express (backend/src/app.js)
        |
        |  routes → middleware → controller → model
        v
MongoDB collections: users, todos
```

During `npm run dev`, Vite forwards any path that starts with `/api` to `http://localhost:8080`. The browser still thinks it is talking to `localhost:5173`. That single address is why the login cookies are allowed to stick.

## Folder map

```text
authapp/
├── backend/
│   ├── server.js                     checks secrets, connects MongoDB, listens
│   ├── src/
│   │   ├── app.js                    builds Express and mounts /api/auth and /api/todo
│   │   ├── config/db.js              opens the MongoDB connection
│   │   ├── constants/tasks.js        allowed priority, status, and page size
│   │   ├── models/
│   │   │   ├── auth.model.js         users collection: name, email, password hash
│   │   │   └── todo.model.js         todos collection: task fields and indexes
│   │   ├── routes/
│   │   │   ├── auth.routes.js        which URL runs which auth function
│   │   │   └── todo.route.js         which URL runs which task function
│   │   ├── controllers/
│   │   │   ├── auth.controller.js    signup, login, me, refresh, logout
│   │   │   └── todo.controller.js    create, list, stats, update, delete
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js    checks signup and login bodies
│   │   │   ├── todo.middleware.js    checks task bodies
│   │   │   ├── requireAuth.middleware.js   reads the access cookie or Bearer token
│   │   │   ├── csrf.middleware.js    checks X-CSRF-Token on cookie changes
│   │   │   └── rateLimit.middleware.js     slows repeated login and signup
│   │   └── utils/
│   │       ├── tokens.js             creates and checks JWTs
│   │       ├── cookies.js            sets and clears the session cookies
│   │       ├── dates.js              reads a due date
│   │       └── taskQuery.js          turns ?status=&page= into a MongoDB query
│   └── tests/                        API tests on a temporary in-memory database
└── frontend/
    └── src/
        ├── main.jsx                  starts React
        ├── App.jsx                   router, auth state, and toasts
        ├── routes/AppRoutes.jsx      which URL shows which page
        ├── pages/
        │   ├── Login.jsx             /login
        │   ├── SignUp.jsx            /signup
        │   ├── Home.jsx              /home dashboard
        │   ├── TasksPage.jsx         /tasks list
        │   └── AddTaskPage.jsx       /tasks/new
        ├── components/
        │   ├── layout/               sidebar, header, page shell
        │   ├── tasks/                task card, filters, form, pagination
        │   └── ui/                   buttons, fields, modal, empty state, skeletons
        ├── context/
        │   ├── AuthContext.jsx       who is logged in
        │   └── TasksContext.jsx      dashboard counts and five newest tasks
        ├── hooks/useTaskList.js      one page of My Todos, driven by the URL
        ├── services/api.js           every API call, cookies, and token refresh
        ├── utils/                    form checks, task labels, URL query helpers
        └── constants/tasks.js        labels for the filter dropdowns
```

A request always moves in one direction: page or hook, then `services/api.js`, then a route, then middleware, then a controller, then a model. Pages do not call Axios themselves, and controllers do not build cookies or query strings by hand when a util already does that.

## Pages

| URL | Who can open it | What it shows |
| --- | --- | --- |
| `/` | anyone | Sends the browser to `/home`. |
| `/login` | only signed-out people | Email and password. A signed-in person is sent to `/home`. |
| `/signup` | only signed-out people | Name, email, and password. |
| `/home` | signed-in people | Counts for every task, and the five newest tasks. Each count card opens the matching list. |
| `/tasks` | signed-in people | One page of tasks. Search, status, priority, sort, and page live in the URL, so a refresh keeps the same list. |
| `/tasks/new` | signed-in people | Form for a new task. After save, the app opens `/tasks`. |
| anything else | anyone | Sends the browser to `/home`. |

Signed-in pages share one frame from `components/layout/AppShell.jsx`: a sidebar on a wide screen, a menu button on a small screen, and a header with the page title, theme switch, and log out.

## What happens when someone logs in

1. `pages/Login.jsx` checks the form, then asks `AuthContext` to log in.
2. `services/api.js` sends `POST /api/auth/login` to `/api`, and Vite forwards it to port 8080.
3. `routes/auth.routes.js` runs the rate limit, then `middleware/auth.middleware.js` checks the body with Zod.
4. `controllers/auth.controller.js` finds the user and compares the password with the bcrypt hash. A missing email and a wrong password return the same message.
5. `utils/tokens.js` makes a 15-minute access token and a 7-day refresh token. Only a hash of the refresh token is saved on the user.
6. `utils/cookies.js` stores both tokens in HttpOnly cookies. JavaScript on the page cannot read them. The response body contains the user, not the tokens.

On the next visit, `AuthContext` calls `GET /api/auth/me`. If the access cookie has expired, `services/api.js` calls `POST /api/auth/refresh`, gets a new pair of cookies, and retries the original request. Using an old refresh token again logs that session out.

## What happens when My Todos loads

1. `routes/AppRoutes.jsx` only renders this page after `ProtectedRoute` confirms a session. `TasksProvider` is already loading dashboard counts beside it.
2. `hooks/useTaskList.js` reads `q`, `status`, `priority`, `sort`, and `page` from the address bar.
3. It calls `GET /api/todo` with those values. The default page size is 8.
4. `middleware/requireAuth.middleware.js` reads the access cookie and sets `req.user.id`.
5. `utils/taskQuery.js` builds the MongoDB filter. The user id is always part of that filter.
6. `controllers/todo.controller.js` returns that page in `data` and the totals in `meta`.
7. `pages/TasksPage.jsx` renders the cards and the pager. Changing a filter updates the URL, which loads the next page from the API.

Creating, editing, or deleting a task also sends `X-CSRF-Token`. `services/api.js` copies that value from the readable `csrfToken` cookie. The server compares the header with the cookie. A script that sends `Authorization: Bearer <access token>` does not need the CSRF header. The login response does not hand out that token. The browser uses cookies.

The dashboard does not use this paged list. `TasksContext` calls `GET /api/todo/stats` for the counts and `GET /api/todo?limit=5&sort=newest` for the recent tasks.

## Run it locally

You need Node.js 20 or newer, and MongoDB running locally or any MongoDB connection string.

```bash
cd backend
cp .env.example .env
npm install

cd ../frontend
cp .env.example .env
npm install
```

Open `backend/.env` and replace both JWT placeholders with long, different random strings. Do not commit `.env`.

Start the API and the site in two terminals:

```bash
cd backend
npm run dev

cd frontend
npm run dev
```

Open `http://localhost:5173`. `npm start` in `backend` runs the API once, without restarting on file changes.

```bash
cd frontend
npm test
npm run lint
npm run build

cd ../backend
npm test
```

Backend tests use Node's test runner, Supertest, and a temporary in-memory MongoDB. They do not use `MONGO_URI`. Frontend tests use Vitest.

## Environment variables

### Backend (`backend/.env`)

| Variable | Purpose |
| --- | --- |
| `PORT` | API port. Default `8080`. |
| `MONGO_URI` | MongoDB connection string. |
| `CLIENT_URL` | Frontend origin allowed by CORS. Use `http://localhost:5173` locally. |
| `JWT_SECRET` | Secret for 15-minute access tokens. |
| `JWT_REFRESH_SECRET` | A different secret for 7-day refresh tokens. |
| `NODE_ENV` | `development` or `production`. |
| `COOKIE_SECURE` | `false` on local HTTP. `true` on HTTPS. |
| `COOKIE_SAMESITE` | `lax` when the site and API share a site. `none` only for separate HTTPS sites. |

### Frontend (`frontend/.env`)

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | `/api` with the Vite dev server. Use `http://localhost:8080/api` only if a built site calls the API directly. |

## Database

Mongoose uses two collections, `users` and `todos`, and creates them on first use. Starting the API also creates these task indexes. That does not delete existing documents.

- `user` + `createdAt` for the newest-first list
- `user` + `status` + `priority` + `createdAt` for filtered lists
- `user` + `dueDate` for overdue lookups

Older tasks may not have `priority`, `status`, or `dueDate`. The API fills those in the response: priority `medium`, and status `completed` or `pending` from the old `completed` flag. A `medium` filter also matches a task that has no priority saved. Editing the task writes the new fields.

## API

The base path is `/api`. Browser requests send cookies. Changes from the browser also send `X-CSRF-Token`.

Task responses look like `{ success, message, data }`. A list also includes `meta`. Auth responses look like `{ message, user }` and do not include tokens.

### Auth

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/signup` | Public | Create an account. Body: `name`, `email`, `password`. |
| `POST` | `/api/auth/login` | Public | Check the password and set cookies. |
| `GET` | `/api/auth/me` | Access cookie or Bearer token | Return the current user. |
| `POST` | `/api/auth/refresh` | Refresh cookie plus CSRF, or a refresh token in the JSON body | Rotate the session. |
| `POST` | `/api/auth/logout` | CSRF when using cookies | Clear cookies and revoke the refresh token. |

Signup and login are limited to 10 attempts per 15 minutes per IP. The limiter lives in process memory and resets when the API process restarts.

### Tasks

Every task route requires an access cookie or `Authorization: Bearer <access token>`.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/todo/stats` | Counts for this user: total, completed, pending, in progress, and overdue. Pending means not completed, so it includes in-progress tasks. |
| `GET` | `/api/todo` | One page of this user's tasks. |
| `POST` | `/api/todo` | Create a task. |
| `PUT` | `/api/todo/:id` | Update this user's task. The body may be partial. |
| `DELETE` | `/api/todo/:id` | Delete this user's task. |

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

List query:

| Param | Default | Values |
| --- | --- | --- |
| `q` | empty | Search title and description. Max 100 characters. |
| `status` | `all` | `all`, `open`, `pending`, `in_progress`, `completed`, `overdue` |
| `priority` | `all` | `all`, `low`, `medium`, `high` |
| `sort` | `newest` | `newest`, `oldest`, `due`, `priority`, `title` |
| `page` | `1` | A page past the end returns the last page. |
| `limit` | `8` | `1` to `50`. |

`open` means not completed. `overdue` means the due date is before today and the task is still open. An unknown filter returns `400`.

`meta` is `{ page, limit, total, pageCount, start, end }`. `data` is only that page.

A missing task, or a task that belongs to someone else, returns `404`. The API does not reveal that the other person's task exists. An id that is not a valid MongoDB id returns `400`.

### Try it with curl

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

## Why the session is built this way

Passwords are bcrypt hashes and are never sent back by the API. Access tokens last 15 minutes. Refresh tokens last 7 days, are stored only as a SHA-256 hash, and are replaced on every refresh. Presenting an old refresh token revokes the session.

The readable cookies are not the credentials. `loggedIn` only tells the interface to ask who the current user is. `csrfToken` is compared with `X-CSRF-Token` because the browser would otherwise attach the HttpOnly cookies to a request from another site. `SameSite=Lax` blocks most of those posts. In production, use HTTPS and `COOKIE_SECURE=true`. If the site and the API are on different sites, set `COOKIE_SAMESITE=none` and serve both over HTTPS. The simpler setup is one site, with the API under `/api`.

Signup, login, and task bodies are checked with Zod. The API does not send internal error details to the browser. React shows task text as text, not as HTML.

## Limits

- Search is a case-insensitive match on that user's title and description. A personal list is fine. A very large account would want an indexed text search.
- The rate limiter is not shared across servers, and it resets when the API process restarts.
- There is no email verification or password reset.
- Marking a completed task incomplete sets the status to Pending, not In Progress.
- Dark mode is stored in this browser only.
- There is no automated browser test of the full click path.

## License

ISC
