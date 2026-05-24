Hello, my name is Skyy. Please add a sentence with your name below.

Bon dia! El meu nom és Sergi

Hello, Miha was here.

Wild Muktim appeared

David said hi from Beijing (travelling in Beijing) 


# UNO Trackscendence

### Modules we are doing

### Tools we are using

- Frontend: React
- Backend: Express
- CSS: Tailwind
- ORM: Prisma
- Database: PostgreSQL
- Proxy: Nginx in production mode
- Container: Docker / Docker Compose

In production mode, Nginx serves the built React frontend and proxies `/api/*` requests to Express. The backend and database stay inside the Docker network.

### Branches Policy

Moving forward create a new branch for each ticket/feature/bug. Any one thing you work on should have it's own branch. Once the feature is finish, merge to dev, and then we will push from dev to main.

### How to run it

#### 1. Prepare environment

Prerequisites: [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed.

1. Clone the repository
```
git clone git@github.com:Trackscendence/trackscendence.git
cd trackscendence
```

2. Copy the environment file and adjust values if needed
```
cp .env.example .env
```

Ports are configured through `.env`.

Important port values:

```env
PORT=3001
SERVER_PORT=3001
CLIENT_PORT=8080
CLIENT_DEV_PORT=5173
DB_PORT=5432
```

`PORT` is the port Express listens on inside the server container. `SERVER_PORT` is the port exposed on your machine in Docker development mode. If another local process already uses `3001`, change only `SERVER_PORT`, for example:

```env
PORT=3001
SERVER_PORT=4242
```

Then the backend is available at `http://localhost:4242`, while Express still logs that it is listening on port `3001` inside Docker.

#### 2. Development mode with Docker

Use this for normal project development:

```
npm run compose:dev
```

This starts:

- Frontend: `http://localhost:<CLIENT_DEV_PORT>` (default `5173`)
- Backend: `http://localhost:<SERVER_PORT>` (default `3001`)
- Database: `localhost:<DB_PORT>` (default `5432`)
- Adminer: `http://localhost:8081`

This mode uses hot reload:

- The client container runs Vite.
- The server container runs Node with `--watch`.
- The database runs in Docker.

Nginx is not used in development mode.

#### 3. Production-style mode with Docker

Use this to test the production container setup:

```
npm run compose:up
```

Open the app at:

```
http://localhost:<CLIENT_PORT>
```

Default:

```
http://localhost:8080
```

In this mode, Nginx serves the frontend and proxies backend requests under `/api/*`.

Other useful commands:

```
npm run compose:logs     # Follow logs from all services
npm run compose:down     # Stop all services
npm run compose:clean    # Stop and remove all data (volumes)
npm run db:shell         # Open a psql shell in the database
```

#### 4. Development mode without Docker

```
npm run install:all
npm run dev
```

This runs the frontend and backend directly on your machine:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

You still need a reachable PostgreSQL database and a valid `DATABASE_URL`.

### Backend API

The backend uses versioned API routes.

Current development endpoints:

- `GET /` - backend API metadata
- `GET /api/v1/ping` - API process check
- `GET /api/v1/health` - database connection check
- `GET /api/docs/` - Swagger docs, development only

Examples in Docker development mode:

```
curl http://localhost:<SERVER_PORT>/
curl http://localhost:<SERVER_PORT>/api/v1/ping
curl http://localhost:<SERVER_PORT>/api/v1/health
```

If `SERVER_PORT=4242`:

```
curl http://localhost:4242/api/v1/ping
```

Old unversioned API routes such as `/api/ping` and `/api/health` are not used.

### Backend Structure

The backend keeps `app.js` and `index.js` at the server root:

- `server/app.js` creates and configures the Express app.
- `server/index.js` starts the HTTP server.

Initial backend setup structure:

```
server/
  app.js
  index.js
  prisma/
    schema.prisma
  src/
    db/
      prisma.js
    docs/
      swagger.js
    exceptions/
      app.exception.js
      bad-request.exception.js
      conflict.exception.js
      forbidden.exception.js
      not-found.exception.js
      unauthorized.exception.js
    middleware/
      auth.middleware.js
      error.middleware.js
      morgan.middleware.js
      rate-limit.middleware.js
      validation.middleware.js
    modules/
      system/
        system.controller.js
        system.routes.js
    routes/
      v1/
        index.js
  utils/
    config.js
    logger.js
```

Route mounting flow:

```
server/app.js
  -> app.use('/api/v1', v1Router)

server/src/routes/v1/index.js
  -> v1Router.use('/', systemRoutes)
```

This produces API URLs like:

```
/api/v1/ping
/api/v1/health
```

Future versions can be added as:

```
server/src/routes/v2/index.js
server/src/routes/v3/index.js
```

### Backend Import Aliases

The backend uses native Node package import aliases with `#` in `server/package.json`.

Use:

```js
const config = require('#utils/config')
const prisma = require('#db/prisma')
const v1Router = require('#routes/v1')
```

Avoid deep relative imports like:

```js
require('../../../utils/config')
```
