# Trackscendence

A real-time multiplayer web application featuring Pong, live chat, tournaments, and leaderboards — built as a single-page application with a Node.js backend and PostgreSQL.

## Features

- **Authentication** — JWT-based auth with email/password, password reset via email, and token invalidation on credential changes
- **Real-time game** — Pong with Socket.io, live match state, and in-memory game store backed by PostgreSQL for history
- **Tournaments** — bracket management with automated progression
- **Leaderboard** — ranked standings via raw SQL aggregation for performance
- **Live chat** — room-based messaging over WebSockets
- **User profiles** — avatars, match history, and stats
- **Role-based access** — USER and ADMIN roles with middleware-enforced route guards

## Tech stack

| Layer     | Technology                     |
| --------- | ------------------------------ |
| Frontend  | React 18, Vite, Tailwind CSS   |
| Backend   | Node.js, Express, Socket.io    |
| Database  | PostgreSQL, Prisma ORM         |
| Auth      | JWT (Bearer), bcrypt           |
| Dev tools | Docker Compose, Nginx, Mailpit |

## Getting started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Node.js 20+ (only needed for non-Docker development)

### Quickstart

```bash
git clone git@github.com:Trackscendence/trackscendence.git
cd trackscendence
cp .env.example .env
npm run compose:dev
```

The development stack will be available at:

| Service  | URL                   |
| -------- | --------------------- |
| Frontend | http://localhost:5173 |
| Backend  | http://localhost:3001 |
| Adminer  | http://localhost:8081 |
| Mailpit  | http://localhost:8025 |

Hot reload is enabled for both the frontend (Vite) and backend (Node `--watch`). Prisma migrations run automatically on server start.

### Environment

All ports and secrets are configured through `.env`. Copy `.env.example` as a starting point — no changes are required for local development.

Key variables:

```env
PORT=3001            # Express port inside the container
SERVER_PORT=3001     # Port exposed on your machine
CLIENT_DEV_PORT=5173
CLIENT_PORT=8080     # Production Nginx port
DB_PORT=5432
JWT_SECRET=          # Required — server won't start without it
DATABASE_URL=        # Required — set automatically in Docker
```

## Development

### Commands

```bash
npm run compose:dev      # Start full stack with hot reload (recommended)
npm run compose:up       # Production-style build (Nginx + built frontend)
npm run compose:down     # Stop all services
npm run compose:clean    # Stop and delete all volumes (wipes database)
npm run compose:logs     # Stream logs from all services
npm run db:shell         # Open a psql shell in the database container
```

```bash
npm run lint:client      # ESLint on client/
npm run format           # Prettier over the whole repo
npm run spellcheck       # cspell check
npm run build            # Vite production build
```

```bash
npm run prisma:migrate   # Run pending migrations (inside Docker)
npm run prisma:generate  # Regenerate Prisma client after schema changes
```

### Without Docker

```bash
npm run install:all
npm run dev
```

Requires a running PostgreSQL instance and a valid `DATABASE_URL` in `.env`. Set `SMTP_*` variables for email delivery, or point `PASSWORD_RESET_URL_BASE` at your frontend origin.

### API

All endpoints are versioned under `/api/v1`:

```
GET /api/v1/ping      # process check
GET /api/v1/health    # database connection check
GET /api/docs/        # Swagger UI (development only)
```

## Repository layout

```
trackscendence/
├── client/            React + Vite frontend (ESM, @/ alias)
├── server/            Express + Socket.io backend (CommonJS, #-aliases)
│   ├── prisma/        Database schema and migrations
│   └── src/
│       ├── exceptions/
│       ├── middleware/
│       ├── modules/   Feature modules (auth, game, user, …)
│       └── routes/
├── docs/              Developer guides and architecture notes
└── compose*.yaml      Docker Compose definitions
```

See [`docs/developer-guide.md`](docs/developer-guide.md) for a detailed backend structure reference, import alias conventions, and architecture decisions.

## Contributing

1. Pick or open an issue.
2. Branch off `dev` using the pattern `feat/<issue>`, `fix/<issue>`, etc.
3. Commit using [Conventional Commits](https://www.conventionalcommits.org/) (`feat`, `fix`, `chore`, `docs`, …).
4. Open a pull request targeting `dev`. All CI checks must pass before merge.
5. `dev` is merged to `main` after review.

The pre-commit hook runs Prettier, cspell, and ESLint automatically.

## License

This project is not yet licensed. All rights reserved by the contributors.
