# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## First rules

- always create a new branch to work on any issues
- always create a clean commit message without leaving "🤖 Generated with [Claude Code](https://claude.com/claude-code)"
- never add `Co-Authored-By: Claude ...` trailers to commit messages
- never stage or commit anything under `.claude/` (settings, memory, local config)

## Written artifact workflow

Any written artifact intended for others (PR descriptions, issue comments, commit message bodies) must go through this workflow:

1. Write the draft and save it to `/tmp/<name>-draft.md`
2. Run `/humanizer` on the draft to remove AI writing patterns
3. Save the result to `/tmp/<name>-final.md` and review/edit it
4. Use the final file (e.g. `cat /tmp/<name>-final.md`) when creating the PR or posting

## Commands

All commands run from the repo root unless noted.

### Running the project

```bash
npm run compose:dev        # preferred — full stack in Docker with hot reload
npm run dev                # local (no Docker) — requires a running PostgreSQL and .env
```

Dev services (Docker): frontend `http://localhost:5173`, backend `http://localhost:3001`, Adminer `http://localhost:8081`, Mailpit `http://localhost:8025`.

```bash
npm run compose:up         # production-style Docker (Nginx, built frontend)
npm run compose:down       # stop containers
npm run compose:clean      # stop + delete volumes (wipes database)
npm run compose:logs       # follow all service logs
```

### Lint, format, spellcheck

```bash
npm run lint:client        # ESLint on client/ (run this before committing)
npm run format             # Prettier over everything
npm run format:check       # CI-style check without writing
npm run spellcheck         # cspell over the whole repo
```

There is no server-side linter configured yet.

### Database

Migrations run automatically when the server starts inside Docker. To run them manually or generate the Prisma client:

```bash
npm run prisma:migrate     # runs inside the Docker server container
npm run prisma:generate    # regenerates Prisma client after schema changes
npm run db:shell           # psql shell inside the Docker database container
```

Schema is at `server/prisma/schema.prisma`. After editing it, always run `prisma:migrate` (dev) to create a migration file, then `prisma:generate` to update the client.

### Building

```bash
npm run build              # builds client/dist (Vite production build)
```

## Architecture

### Repository layout

```
trackscendence/
├── client/        React + Vite frontend
├── server/        Express + Socket.io backend (CommonJS)
└── compose*.yaml  Docker Compose definitions
```

### Backend (`server/`)

**Module system:** CommonJS (`"type": "commonjs"`). Uses Node package import aliases defined in `server/package.json` — always use these, never deep relative paths:

```js
require('#utils/config') // server/utils/config.js
require('#db/prisma') // server/src/db/prisma.js
require('#modules/auth/auth.service')
require('#middleware/auth.middleware')
require('#exceptions/not-found.exception')
require('#routes/v1')
```

**Request lifecycle:** `app.js` → `routes/v1/index.js` → module router → controller → service → repository → Prisma.

- **Controllers** (`*.controller.js`): extract and validate input from `req`, call service, send response. No business logic.
- **Services** (`*.service.js`): all business logic, validation, bcrypt, JWT, error throwing.
- **Repositories** (`*.repository.js`): all Prisma queries. Use explicit `select` objects to avoid leaking fields like `passwordHash`.

**Exception pattern:** Throw typed exceptions from `src/exceptions/`. They all extend `AppException` and carry `statusCode`, `code`, and optional `payload`. The `errorHandler` middleware in `error.middleware.js` serializes them into `{ error: { code, message, payload? } }`. The client reads `error.code` and `error.message`.

```js
throw new BadRequestException('Invalid request data', { details: [...] })
throw new UnauthorizedException('Invalid or expired token')
throw new ConflictException('Email is already registered')
```

**Auth:** Bearer JWT in `Authorization` header. Tokens embed `sub` (userId), `role`, and `tokenVersion`. `requireAuth` middleware populates `req.user`. `requireRole('ADMIN')` gates admin endpoints. Changing a password increments `tokenVersion`, immediately invalidating all existing tokens for that user.

**Socket.io:** Mounted on `/websocket/` in `server/index.js` (not in `app.js`). On connection, the server emits `token` with a callback; the client must respond with its JWT within 5 seconds or the socket is disconnected. The authenticated user is stored on `socket.user`.

**In-memory game state:** `src/modules/game/game.store.js` uses a `Map` with async methods — intentionally async so it can be swapped for Redis without changing callers. Completed games are flushed to PostgreSQL via `game.repository.js`.

**Environment variables:** `DATABASE_URL` and `JWT_SECRET` are required at startup — the server throws if either is missing. All other config lives in `server/utils/config.js` with documented defaults.

### Frontend (`client/`)

**Module system:** ESM. All imports use the `@/` alias which resolves to `client/src/`.

**Folder/barrel pattern:** Every component, hook, page, and utility lives in its own named folder with an `index.js` barrel (`export { default } from './ComponentName'`). Private sub-components go in `_components/` inside the parent folder. See `docs/frontend-coding-standards.md` for the full rules.

**State management:** Zustand replaces React Context entirely. No Provider in `main.jsx`. Stores (`src/stores/`) are domain-scoped singletons. `useAuthStore.getState().init()` is called once in `App.jsx` to hydrate the session. Cross-store reads inside actions use `useOtherStore.getState()`, not the hook.

**Routing:** `App.jsx` defines all routes. Protected routes are nested under `<ProtectedRoute>` then `<Layout>`. `Layout` provides the shared navbar and footer (which must contain Privacy Policy and Terms of Service links — required for evaluation). Public routes (`/login`, `/signup`, `/privacy-policy`, etc.) render their own full-page layout.

**API calls:** `src/services/*.js` are plain functions that call `src/utils/request/request.js`. Pages never import from `services/` directly — they go through store actions. The `request` utility dispatches a `trackscendence:session-expired` custom event on 401 responses, which `App.jsx` listens for to clear auth state.

**Socket client:** `src/services/socket.js` exports a single socket.io instance configured with `autoConnect: false` and `path: '/websocket/'`. Pages connect/disconnect in `useEffect`.

### Frontend coding standards

Full reference: `docs/frontend-coding-standards.md`. The rules below are the non-obvious ones most likely to be violated.

**Container vs. presenter (most violated rule)**

Every component is either a **container** (knows about domain concepts, reads from stores, passes data down) or a **presenter** (accepts props only, renders HTML/Tailwind). They must never be the same component. Max 2 levels of prop drilling — if a value travels through 3+ components, it belongs in a store.

```
Page (top-level container)
└── Section container (_components/SectionName/)
    ├── Feature container (_components/FeatureName/)
    │   └── Presenter
    └── Presenter
```

Layer rules:

| Layer                     | Allowed                                      | Not allowed                                   |
| ------------------------- | -------------------------------------------- | --------------------------------------------- |
| Page                      | Read stores, pass data down, handle routing  | Raw HTML, local UI state beyond loading/error |
| Section/Feature container | Coordinate children, own local feature state | Fetch data, manage global state               |
| Presenter                 | Render props as HTML/Tailwind                | Store reads, state                            |

Warning signs a boundary has been crossed: a presenter imports from a store; a container mixes `useEffect` socket logic with dense Tailwind JSX; a component exceeds ~100 lines.

**Form extraction rule**

When a page has a form with 2+ fields or non-trivial validation, extract it to `_components/FormName/`. The page renders `<LoginForm />`; the form component owns `form`, `error`, `isSubmitting`. Single-field pages may inline the form.

```
Login/
├── Login.jsx                ← renders <LoginForm />, handles navigation
├── _components/
│   └── LoginForm/
│       ├── LoginForm.jsx    ← owns form state, calls useAuthStore().login
│       └── index.js
└── index.js
```

**Store subscription: slices, not the whole store**

```js
const token = useAuthStore((state) => state.token) // re-renders only when token changes
const { login } = useAuthStore.getState() // actions need no subscription
```

**Component writing rules**

- No anonymous components — `export default ({ ... }) => ...` breaks DevTools. Always assign a name.
- No inline styles — Tailwind only. `style={}` only for values that cannot be expressed as a utility class.
- One component per file. A stateless, hook-free helper `const` inside the file is acceptable; otherwise extract to `_components/`.
- Guard clauses first, happy path last:

```jsx
if (isLoading) return <LoadingSpinner />
if (!user) return <Navigate to="/login" replace />
return <div>...</div>
```

- Never `0 && <Thing />` — use `items.length > 0 &&` or a ternary.
- `useEffect` cleanup is mandatory wherever listeners or timers are registered:

```js
useEffect(() => {
  socket.on('message', handler)
  return () => socket.off('message', handler)
}, [handler])
```

**Hard anti-patterns**

- Don't call services from components. Flow is: component → store action → service → `utils/request`.
- Don't let a presenter read from a store. Pass data down or promote the component to a container.
- Don't import `_components/` from outside its parent. If needed in two places, move it to `components/`.
- Don't use relative `../../` imports — everything uses `@/` except intra-folder references (`./`).
- Don't mix `useEffect` side effects and dense Tailwind JSX in the same component file.
- Don't prop-drill more than two levels. Third level = move to a store.
- Don't grow a component past ~100 lines without splitting out a second responsibility.

**Page inventory**

| Folder            | Route               | Protected |
| ----------------- | ------------------- | --------- |
| `Login/`          | `/login`            | No        |
| `Signup/`         | `/signup`           | No        |
| `ForgotPassword/` | `/forgot-password`  | No        |
| `ResetPassword/`  | `/reset-password`   | No        |
| `ChangePassword/` | `/change-password`  | Yes       |
| `Profile/`        | `/profile`          | Yes       |
| `User/`           | `/users/:username`  | Yes       |
| `Lobby/`          | `/lobby`            | Yes       |
| `Game/`           | `/game`             | Yes       |
| `Chat/`           | `/chat`             | Yes       |
| `Tournament/`     | `/tournament`       | Yes       |
| `Leaderboard/`    | `/leaderboard`      | Yes       |
| `PrivacyPolicy/`  | `/privacy-policy`   | No        |
| `TermsOfService/` | `/terms-of-service` | No        |

**Evaluation requirements (non-negotiable)**

- `PrivacyPolicy` and `TermsOfService` pages must be fully written (not placeholders) and linked from `Layout`'s footer.
- `ErrorBoundary` must wrap `<Routes>` in `App.jsx`.
- Zero browser console errors: stable `key` on all list renders, `alt` on all `<img>`, `try/catch` in all `useEffect` async calls, no unhandled promise rejections.
- Custom design system: `components/` must have at least 10 cohesive, reusable components. Current 10: `Avatar`, `Button`, `ErrorBoundary`, `FormField`, `Input`, `Layout`, `LoadingSpinner`, `Modal`, `ProtectedRoute`, `Toast`. Dropping below 10 loses the evaluation point.

### Git workflow

- Branch per issue/feature/bug → merge to `dev` → `dev` to `main`.
- Commit messages follow **Conventional Commits**: `feat`, `fix`, `chore`, `docs`, `refactor`, `style`, `test`, `ci`, `perf`, `build`, `revert`. Body lines must be ≤ 100 characters.
- Pre-commit hook runs lint-staged: Prettier, cspell, then ESLint (`--fix`) on client files.
- The `commitlint` hook enforces the type list above — `feature` is not valid, use `feat`.

### Database schema

Three models in `server/prisma/schema.prisma`:

- `User` — email, username, passwordHash, tokenVersion, role (USER/ADMIN), password reset fields.
- `Game` — status (COMPLETED/ABANDONED), startedAt, endedAt.
- `GamePlayer` — join table linking User ↔ Game with score and isWinner. Unique on (gameId, userId).

The leaderboard query uses `$queryRaw` (raw SQL) for Postgres-level aggregation — not Prisma's aggregation API.
