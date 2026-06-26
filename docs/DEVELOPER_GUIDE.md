# Trackscendence — Developer & Contribution Guide

This guide is designed for developers contributing to the Trackscendence project. It covers project navigation, local and Docker-based development, database management with Prisma, Git workflows, and coding standards.

---

## Table of Contents

1. [Documentation Strategy & Guidelines](#1-documentation-strategy--guidelines)
2. [Project Directory Map](#2-project-directory-map)
3. [Local & Dockerized Development](#3-local--dockerized-development)
4. [Database Workflows (Prisma ORM)](#4-database-workflows-prisma-orm)
5. [Git & Contribution Workflow](#5-git--contribution-workflow)
6. [Coding Standards & Lints](#6-coding-standards--lints)
7. [Docker & CI/CD Architecture](#7-docker--cicd-architecture)
8. [UI Workshop (Storybook)](#8-ui-workshop-storybook)
9. [Backend API & Directory Architecture](#9-backend-api--directory-architecture)

---

## 1. Documentation Strategy & Guidelines

To maintain a clean and production-grade repository, we separate high-level product documentation from developer workflows and detailed technical guides.

### Where to Document:

- **`README.md` (Root)**:
  - **Audience**: Evaluators, users, and newcomers.
  - **Content**: Project title, tech stack badges, high-level features, core product requirements (e.g., security & authentication overview), targeted points module matrix, classic gameplay rules, and quick docker run commands.
- **`docs/DEVELOPER_GUIDE.md` (Here)**:
  - **Audience**: Active developers and contributors.
  - **Content**: Detailed monorepo layouts, local and containerized build setups, Prisma migrations, Git branching strategies, Husky formatting lints, CI/CD promotion systems, Storybook workshops, and backend directory structure.
- **`docs/*.md` (Specialized Guides)**:
  - **Audience**: Developers working on specific features.
  - **Content**: Deep-dive designs, diagrams, and Postman setups for particular modules (e.g. [Two-Factor Authentication Guide](./two-factor-auth.md) and [Storybook Guide](./storybook.md)).

When updating documentation:

1. Avoid repeating raw command guides or folder lists in the main `README.md`—delegate them to this Developer Guide.
2. Ensure all internal file references use relative repository links (e.g. `[Two-Factor Guide](./two-factor-auth.md)`) so they render and navigate correctly on the GitHub web interface.

---

## 2. Project Directory Map

The repository is structured as a monorepo, separating frontend and backend logic.

```text
trackscendence/
├── .agents/               # Agent-specific instructions (ignored locally)
├── assets/                # Design assets (e.g., PERN stack diagrams, logos)
├── client/                # Frontend application (React + Vite + Tailwind CSS v4)
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── layouts/       # Page layout wrappers (e.g., Sidebar, Navbar)
│   │   ├── pages/         # Page components mapped to routes
│   │   ├── router/        # React Router routes setup
│   │   ├── services/      # API communication clients
│   │   ├── stores/        # Zustand state stores (flat/light state management)
│   │   └── utils/         # Helper functions
│   ├── index.html         # SPA entry HTML
│   └── vite.config.js     # Vite builder setup
├── docs/                  # Developer guides, API docs, and coding standards
├── server/                # Backend API server (Express.js + Socket.IO + Prisma)
│   ├── prisma/            # Database schema definition and migration logs
│   ├── src/
│   │   ├── db/            # Prisma client instance initialization
│   │   ├── exceptions/    # Custom API exception classes (e.g., BadRequestException)
│   │   ├── middleware/    # Express middlewares (auth, validation, error handler)
│   │   ├── modules/       # Domain-driven features (e.g., auth, game, system)
│   │   │   └── [feature]/ # Feature subfolders containing routes, controllers, services, repositories
│   │   └── routes/        # Router configuration and API versioning
│   ├── app.js             # Express application initialization
│   └── index.js           # HTTP server, WebSocket connection, and process entrypoint
├── compose.yaml           # Primary Docker Compose configuration
├── compose.dev.yaml       # Development-specific Docker overrides (hot-reloading)
└── package.json           # Root package defining development scripts
```

---

## 3. Local & Dockerized Development

We use Docker to ensure consistent runtime environments. However, you can also run components locally.

### Mode A: Docker Compose (Recommended)

This method spins up the frontend, backend, PostgreSQL database, and Adminer (database viewer) automatically.

- **Start Development (Hot-reloading enabled):**

  ```bash
  npm run compose:dev   # or: just dev
  ```

  - Frontend: `http://localhost:5173`
  - Backend: `http://localhost:3001`

- **Follow Logs:**
  ```bash
  npm run compose:logs  # or: just logs
  ```
- **Stop Containers:**
  ```bash
  npm run compose:down  # or: just down
  ```
- **Prune Volumes (Wipes DB data!):**
  ```bash
  npm run compose:clean # or: just clean
  ```

### Mode B: Direct Local Execution

If you prefer running without Docker (requires node.js and an active external PostgreSQL instance):

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```
2. **Start Dev Server (frontend + backend concurrently):**
   ```bash
   npm run dev
   ```

---

## 4. Database Workflows (Prisma ORM)

Database schemas are defined in [schema.prisma](../server/prisma/schema.prisma).

### Common Tasks

- **Write / Apply migrations:**
  When you modify the Prisma schema, generate and run a new migration:
  ```bash
  # Docker container execution:
  just db-migrate "describe_your_changes"
  # or:
  npm run prisma:migrate -- "describe_your_changes"
  ```
- **Generate Prisma Client:**
  ```bash
  just db-generate   # or: npm run prisma:generate
  ```
- **Regenerate the ERD docs:**
  ```bash
  npm run docs:erd --prefix server
  ```
- **Access PostgreSQL CLI directly:**
  ```bash
  just db-shell      # or: npm run db:shell
  ```

---

## 5. Git & Contribution Workflow

We follow conventional development practices to keep the repository history clean.

### Branching Policy

1. Create a new branch for each ticket/feature/bug from `dev`.
   - Name your branch according to the type of work: `feature/[issue-id]-[short-name]` or `fix/[issue-id]-[short-name]`.
2. Once the feature is complete, open a Pull Request (PR) against `dev`.
3. Obtain a code review from at least one teammate.
4. Merge into `dev`.
5. Pushes to `main` are reserved for stable releases ready for evaluation.

> [!NOTE]
> For a detailed walkthrough of automated CI target checks, required status approvals, and branch protection enforcement settings, see the [Branch Protection Guide](./branch-protection-guide.md).

### Commit Messages

We enforce conventionally formatted commit messages via Husky + Commitlint. Format commits as:

```text
<type>(<scope>): <short description>
```

- **Types:** `feat` (new feature), `fix` (bug fix), `docs` (documentation), `style` (formatting), `refactor` (cleanup), `test` (adding tests), `chore` (maintenance).
- **Example:** `feat(auth): implement two-factor authentication toggle`

### GitHub Project Board Categories

- **Backlog**: Planned tasks that are not yet ready to be started.
- **Ready**: Tasks ready to be picked up by any available developer.
- **In Progress**: Tasks currently being worked on by an assignee.
- **Done**: Completed tasks merged and verified.

---

## 6. Coding Standards & Lints

To maintain a consistent codebase, we run automatic checks before commits (Husky + lint-staged).

- **Format Code:**
  ```bash
  npm run format       # or: just format
  ```
- **Verify Lint Rules:**
  ```bash
  npm run lint         # or: just lint-client
  ```
- **Run Spellcheck:**
  ```bash
  npm run spellcheck   # or: just spellcheck
  ```

---

## 7. Docker & CI/CD Architecture

We use Docker Compose overlays to support both local development and production-like builds, combined with GitHub Actions for automated verification and deployment.

### 7.1 Docker Compose Overlay Model

Rather than maintaining separate, duplicated configuration files, we use Docker Compose overlays:

1. **`compose.yaml` (Base)**: Sets up the production-style configuration. It compiles React and builds self-contained, production-ready images without mounting host directories.
2. **`compose.dev.yaml` (Override)**: Applied on top of the base file via `npm run compose:dev` (or `just dev`). It:
   - Mounts local source directories (`./client` and `./server`) into the containers for **hot reloading**.
   - Runs development servers (`npm run dev` and `node --watch`).
   - Exposes database ports (`5432`) and Vite's dev port (`5173`) to the host.
   - Spins up **Adminer** on `http://localhost:8081` for visual database inspection.

### 7.2 CI/CD & GitHub Container Registry (GHCR)

Our workflows in `.github/workflows/` automate checks and releases:

- **CI Pipeline (`ci.yml`)**: Triggered on pull requests to `dev` and `main`. It runs formatting, spelling, lints, and executes `docker compose build` to verify the production build compiles. It also blocks direct PRs to `main` from branches other than `dev`.
- **CD Release Pipeline (`cd.yml`)**: Triggered on pushes/merges to `dev` or `main`.
  - **Dev Release**: Builds and pushes Docker images to GHCR tagged with `:dev` and the git commit SHA:
    - Client: `ghcr.io/<owner>/trackscendence-client:dev`
    - Server: `ghcr.io/<owner>/trackscendence-server:dev`
  - **Production Release**: When merged to `main`, the CD pipeline pulls the existing `:dev` images from GHCR, retags them as `:main` and `:latest`, and pushes them back. This **promotion strategy** guarantees that the exact image verified in dev is deployed to production without rebuilding.

---

## 8. UI Workshop (Storybook)

We use Storybook to review shared UI components outside the main application routes. This is especially useful for styling and isolating primitives (such as the `Card` component) before integrating them into a page.

- **Start Storybook (Port 6006):**
  ```bash
  npm run storybook
  ```
  Open: `http://localhost:6006`
- **Build Static Storybook Bundle:**
  ```bash
  npm run build-storybook
  ```

For more details on the Storybook configuration and workflow, see [docs/storybook.md](storybook.md).

---

## 9. Backend API & Directory Architecture

### 9.1 API Versioning

The Express backend uses versioned API routes under `/api/v1/`.

Current baseline endpoints:

- `GET /` — API metadata
- `GET /api/v1/ping` — Service process check
- `GET /api/v1/health` — Database connection check
- `GET /api/docs/` — Swagger API Documentation (development only)

### 9.2 Backend Directory Structure

The server follows a modular architecture:

```text
server/
  app.js                 # App configuration & routing setup
  index.js               # Entrypoint (HTTP & Socket.io server startup)
  prisma/
    schema.prisma        # Database schema
  src/
    db/                  # Prisma client instance
    exceptions/          # Custom API error exceptions
    middleware/          # Custom middleware (auth, rate-limit, validation)
    modules/             # Feature domains (e.g. auth, game, friends)
    routes/
      v1/                # v1 Router mounting
  utils/                 # App configurations and logging utilities
```

### 9.3 Import Aliases

We use Node.js subpath imports (`#` aliases) defined in `server/package.json` to prevent deep relative imports. Always use aliases:

```javascript
const config = require('#utils/config')
const prisma = require('#db/prisma')
```

Avoid relative paths like `require('../../../utils/config')`.
