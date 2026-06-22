# Trackscendence — Developer & Contribution Guide

This guide is designed for developers contributing to the Trackscendence project. It covers project navigation, local and Docker-based development, database management with Prisma, Git workflows, and coding standards.

---

## 1. Project Directory Map

The repository is structured as a monorepo, separating frontend and backend logic.

```
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
├── justfile               # Just command runner targets (alternative to npm scripts)
└── package.json           # Root package defining development scripts
```

---

## 2. Local & Dockerized Development

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

## 3. Database Workflows (Prisma ORM)

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
- **Access PostgreSQL CLI directly:**
  ```bash
  just db-shell      # or: npm run db:shell
  ```

---

## 4. Git & Contribution Workflow

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

```
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

## 5. Coding Standards & Lints

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
