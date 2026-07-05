# Frontend Coding Standards

This document captures the coding philosophy, structural patterns, and design decisions behind the Trackscendence frontend (`client/src/`). It exists to keep every contributor writing code that feels like it came from the same hand.

> **Source:** This document is grounded in [issue #105](https://github.com/Trackscendence/trackscendence/issues/105), which defines the agreed architecture. If this document and the issue ever conflict, the issue is the primary source and this doc should be updated.

---

## 1. Core Philosophy

**Readable over clever.** Code is read far more than it is written. If the next developer has to pause to decode what something does, it should be rewritten.

**Boring over novel.** Use the simplest structure that solves the problem. Don't reach for a pattern because it's interesting; reach for it because it reduces friction for the next change.

**Flat state, composed UI.** State lives in Zustand stores (flat, domain-scoped). UI is composed from small, focused components. Pages are thin orchestrators — they do not own logic.

**No Provider nesting.** Zustand replaces React Context entirely. `main.jsx` wraps nothing — no `AuthProvider`, no `ThemeProvider`, no `QueryClientProvider`. When you need global state, create or extend a store.

---

## 2. Folder & Barrel Pattern

Every component, hook, page, and utility lives in its own named folder with an `index.js` barrel. No exceptions.

```text
ComponentName/
├── ComponentName.jsx     ← the implementation
├── index.js              ← re-export only: export { default } from './ComponentName'
├── _components/          ← private child components (underscore = not for import outside)
│   └── ChildName/
│       ├── ChildName.jsx
│       └── index.js
└── _utils/               ← private helpers scoped to this component
    └── helperFn/
        ├── helperFn.js
        └── index.js
```

**The barrel rule.** `index.js` contains exactly one line:

```js
export { default } from './ComponentName'
```

Nothing else. No logic, no re-grouping, no star exports. Barrels exist solely so callers write `import Button from '@/components/Button'` instead of `import Button from '@/components/Button/Button'`.

**The underscore rule.** A folder prefixed with `_` is private to its parent. If `_components/ChildName` is needed elsewhere, it graduates to `components/` — it does not stay private and get imported across module boundaries.

**The two-place rule.** If something is used in two or more places, it belongs in `components/` or `hooks/`. If it is only ever used inside one page, it lives in that page's `_components/`.

---

## 3. Directory Map

```text
client/src/
├── components/        shared UI primitives (Button, Card, Input …)
├── layouts/           route-level shells — Outlet-based wrappers
│   ├── AppLayout/     authenticated shell: Navbar + Outlet + footer
│   └── PublicLayout/  centered wrapper for public auth pages
├── hooks/             shared custom hooks
├── pages/             one folder per route
├── services/          plain JS — API calls only, no React
├── stores/            Zustand — one file per domain
├── utils/             pure functions, zero React
├── App.jsx
└── main.jsx
```

`layouts/` vs `components/`: layouts use `<Outlet />` and are wired into the route tree in `App.jsx`. They are never rendered directly inside another component. `components/` holds UI primitives that are composed anywhere props are passed.

---

## 4. Page Inventory

Every page maps one-to-one with a route. This is the full intended list — stub folders should be created even before the page is implemented, so routing stays clean.

| Page folder       | Route               | Purpose                                  | Notable `_components/`                          |
| ----------------- | ------------------- | ---------------------------------------- | ----------------------------------------------- |
| `Login/`          | `/login`            | Auth entry                               | —                                               |
| `Signup/`         | `/signup`           | Account creation                         | —                                               |
| `ForgotPassword/` | `/forgot-password`  | Request reset email                      | —                                               |
| `ResetPassword/`  | `/reset-password`   | Consume reset token                      | —                                               |
| `ChangePassword/` | `/change-password`  | Authenticated password change            | —                                               |
| `Profile/`        | `/profile`          | View and edit own profile, avatar upload | `AvatarUpload/`, `ProfileForm/`                 |
| `User/`           | `/users/:username`  | View another user's public profile       | —                                               |
| `Lobby/`          | `/lobby`            | Matchmaking and waiting room             | `MatchQueue/`, `PlayerList/`                    |
| `Game/`           | `/game`             | Active Pong match                        | `PongCanvas/`, `Score/`                         |
| `Chat/`           | `/chat`             | Direct messages and rooms                | `MessageList/`, `MessageInput/`, `RoomSidebar/` |
| `Tournament/`     | `/tournament`       | Bracket view and registration            | `Bracket/`, `RegistrationPanel/`                |
| `Leaderboard/`    | `/leaderboard`      | Rankings and match history               | `RankTable/`, `MatchHistoryList/`               |
| `PrivacyPolicy/`  | `/privacy-policy`   | **Required for evaluation**              | —                                               |
| `TermsOfService/` | `/terms-of-service` | **Required for evaluation**              | —                                               |

`Profile/`, `User/`, `Lobby/`, `Game/`, `Chat/`, `Tournament/`, and `Leaderboard/` are all protected routes rendered inside `Layout`. `PrivacyPolicy` and `TermsOfService` are public — no `ProtectedRoute` wrapper, own full-page layout.

---

## 5. Evaluation Requirements

These items are **mandatory**. Evaluation fails without them, regardless of feature completeness.

| Requirement                                            | Where it lives                                                         |
| ------------------------------------------------------ | ---------------------------------------------------------------------- |
| `PrivacyPolicy` page — fully written, not placeholder  | `pages/PrivacyPolicy/`                                                 |
| `TermsOfService` page — fully written, not placeholder | `pages/TermsOfService/`                                                |
| Both pages linked from every protected page            | Footer inside `layouts/AppLayout/AppLayout.jsx`                        |
| Zero browser console errors or warnings                | `ErrorBoundary`, `key` props, `alt` on images, no unhandled rejections |
| `ErrorBoundary` wrapping the app                       | `App.jsx` wraps `<Routes>`                                             |

**Console zero-error rule** in detail:

- Every list render uses a stable `key` (not the array index).
- Every `<img>` has a non-empty `alt` attribute.
- Every `async` call inside a `useEffect` that can fail is wrapped in `try/catch`.
- Promises returned by event handlers are not swallowed silently.

---

## 6. Custom Design System Module

The project claims the **custom design system minor module (1 point)**. The deliverable is `components/` — at least 10 cohesive, reusable UI primitives. Current count: `Avatar`, `Button`, `Card`, `ErrorBoundary`, `FormField`, `Input`, `LeaderboardTable`, `LoadingSpinner`, `Modal`, `Toast` = **10**. `LeaderboardTable` renders the ranked-players rows shared by the profile leaderboard and the post-game results snapshot.

Note: `AppLayout` and `AuthLayout` live in `layouts/`, and `ProtectedRoute` lives in `router/` — none of these count toward the total as they are route shells, not UI primitives.

Criteria for a component to count toward this module:

- Lives in `components/` (shared, not page-private)
- Has its own folder + barrel
- Accepts props that meaningfully control its output
- Used by at least two pages or components

---

## 7. SOLID in React

### S — Single Responsibility

Each unit does exactly one thing.

| Unit                               | Its one job                                                     |
| ---------------------------------- | --------------------------------------------------------------- |
| Page component                     | Compose child components, wire up store values and handlers     |
| Form component (in `_components/`) | Own form field state, validation logic, and submit handler      |
| Service function                   | Make one API call and return the result                         |
| Store                              | Own domain state and expose actions that mutate it              |
| Shared component                   | Render a reusable UI primitive with props controlling variation |
| Hook                               | Encapsulate one piece of reusable behaviour                     |

**Violation to avoid:** A page that directly calls `fetch`, owns a complex state machine, and renders 300 lines of JSX. Split it — fetch goes in services, state goes in store or local state, rendering gets broken into `_components/`.

**The form rule.** When a page contains a form with non-trivial state (more than one field, validation, async submit), extract it to `_components/FormName/`. The page renders `<LoginForm />`, not 60 lines of form JSX. The form component owns `form`, `error`, `isSubmitting` — not the page.

```text
Login/
├── Login.jsx              ← renders <LoginForm />, reads route state, handles navigation
├── _components/
│   └── LoginForm/
│       ├── LoginForm.jsx  ← owns form state, calls useAuthStore().login
│       └── index.js
└── index.js
```

For simple pages with a single field (like `ForgotPassword`), inlining the form in the page file is acceptable. The threshold is roughly: two or more fields with interdependent validation → extract.

### O — Open/Closed

Components are open for extension through props, closed to internal edits.

```jsx
// Button accepts a `variant` prop — callers extend behaviour without editing Button.jsx
<Button variant="outline">Cancel</Button>
<Button variant="primary">Save</Button>
```

Internally, `Button` maps variants to class strings. A new variant means adding one entry to the map — not adding a conditional into the render tree.

```js
const VARIANTS = {
  primary: 'bg-[#2f7d61] text-white hover:bg-[#276a52] disabled:bg-[#91a69b]',
  outline:
    'border border-[#cbd5c5] text-[#27352f] hover:border-[#2f7d61] hover:text-[#2f7d61]',
}
```

### L — Liskov Substitution

Wrapper components must not break the contract of the element they wrap.

```jsx
// Input spreads all props through to the native <input> — callers can use any
// attribute (type, autoComplete, minLength, required) without needing Input to
// explicitly handle each one.
const Input = ({ className = '', ...props }) => (
  <input className={`...base... ${className}`} {...props} />
)
```

If a wrapper silently drops props or forces defaults that can't be overridden, it violates LSP.

### I — Interface Segregation

Consume only the slice of state you need. Don't subscribe to the whole store.

```js
// Good — component only re-renders when `user` changes
const user = useAuthStore((state) => state.user)

// Avoid — component re-renders on every store mutation
const store = useAuthStore()
```

The same principle applies to props: don't pass a whole object when a component only needs two fields from it.

### D — Dependency Inversion

Pages and components depend on abstractions (stores, hooks), not on concrete implementations (services, fetch).

```text
Page → useAuthStore (abstraction)
         → services/auth.js (concrete)
              → utils/request (HTTP plumbing)
```

A page never imports from `services/` directly. If it needs data, it reads from a store or calls a store action. If that data doesn't exist in a store yet, create the store slice — don't shortcut by calling the service from the component.

---

## 8. Container and Sub-Container Relationships

This is the most violated principle in frontend codebases. Unclear container/sub-container boundaries are what turn a clean codebase into spaghetti over time.

### The mental model

Every component is either a **container** or a **presenter**. A container knows about domain concepts (users, matches, rooms). A presenter knows only about what it renders (text, colour, size).

```text
Container knows:     "show the logged-in user's match history, paginated"
Presenter knows:     "render a list of rows with these columns"
```

They should never be the same component.

### Layer hierarchy

```text
Page (top-level container)
└── Section container (_components/SectionName/)
    ├── Feature container (_components/FeatureName/)
    │   ├── Presenter component (shared or local)
    │   └── Presenter component
    └── Presenter component
```

Each layer has one job:

| Layer                 | Allowed to do                                              | Not allowed to do                                        |
| --------------------- | ---------------------------------------------------------- | -------------------------------------------------------- |
| **Page**              | Read from stores, pass data down, handle routing           | Own local UI state beyond loading/error, render raw HTML |
| **Section container** | Own a slice of the page's layout, coordinate children      | Fetch data, manage global state                          |
| **Feature container** | Own local state for its feature (form, toggle, pagination) | Know about sibling features                              |
| **Presenter**         | Accept props, render HTML/Tailwind                         | Read from stores, hold state                             |

### Concrete example — the Game page

```text
Game/
├── Game.jsx                         ← reads useGameStore, passes match data down
├── _components/
│   ├── GameBoard/                   ← section container: manages canvas lifecycle
│   │   ├── GameBoard.jsx
│   │   ├── _components/
│   │   │   ├── PongCanvas/          ← feature: owns canvas ref, renders the game
│   │   │   └── Score/               ← presenter: receives { playerA, playerB } props
│   │   └── index.js
│   └── GameControls/                ← section: pause, forfeit buttons
│       ├── GameControls.jsx
│       └── index.js
└── index.js
```

`Game.jsx` reads the store. `GameBoard.jsx` receives props and manages the canvas. `PongCanvas.jsx` renders the canvas. `Score.jsx` renders two numbers. None of these layers touch each other's concerns.

### Warning signs that a boundary has been crossed

- A presenter imports from a store.
- A page renders raw `<ul>/<li>` tags directly (should be a list presenter).
- A container has both `useEffect` socket listeners AND Tailwind className strings in the same file.
- A component file is longer than ~100 lines — it is almost certainly doing two jobs.
- Props are passed more than two levels deep ("prop drilling") — this signals a missing intermediate container or a state that should live in a store.

### The "two levels" prop-drilling rule

If a value needs to travel through more than two component levels to reach its consumer, it belongs in a store, not in props.

```jsx
// Bad — token drilled through three layers
<Game token={token}>
  <GameBoard token={token}>
    <PongCanvas token={token} />

// Good — PongCanvas reads directly from store
const token = useAuthStore(state => state.token)
```

---

## 9. Design Patterns in Use

### 5.1 Composite Pattern

The entire component tree is composition. `Layout` composes `Outlet` (router children), a navbar, and a footer. `FormField` composes a `<label>`, a `<span>`, an `Input`, and an optional hint. Pages compose everything.

Composition is preferred over inheritance. There are no base components to extend — only props to pass and children to render.

### 5.2 Strategy Pattern

Variant-driven components use Strategy: the caller selects a strategy (a variant name), and the component dispatches to the matching implementation.

```jsx
// The variant is the strategy selector
<Button variant="primary" />
<Button variant="outline" />

// Internally, a lookup table is the dispatcher
const VARIANTS = { primary: '...', outline: '...' }
const Button = ({ variant = 'primary', ...props }) => (
  <button className={`...base ${VARIANTS[variant]}`} {...props} />
)
```

### 5.3 Facade Pattern

Every `services/*.js` file is a facade. It hides the HTTP plumbing (`utils/request/`) behind a clean, intention-revealing function name.

```js
// Caller sees intent, not implementation
import { login, logout, fetchCurrentUser } from '@/services/auth'

// The raw mechanism is one layer below
// utils/request/request.js handles headers, error parsing, token dispatch
```

### 5.4 Singleton Pattern

Two things in this codebase are singletons:

1. **The socket.io client** (`services/socket.js`) — one connection shared across the app.
2. **Every Zustand store** — `create()` returns a hook backed by a single store instance. All components reading from `useAuthStore` see the same state.

Both are module-level singletons: they are initialised once on first import and reused for the lifetime of the page.

### 5.5 Observer Pattern

Zustand's reactivity is an observer. Components subscribe to store slices; when the slice changes, React re-renders the subscriber.

Socket event listeners (`socket.on('message', handler)`) are also observer registrations. The cleanup in `useEffect`'s return function (`socket.off('message', handler)`) deregisters the observer — always include it to prevent memory leaks and duplicate handlers.

```js
useEffect(() => {
  socket.on('message', handler)
  return () => socket.off('message', handler) // ← deregister
}, [handler])
```

### 5.6 Template Method Pattern (via AppLayout)

`AppLayout.jsx` defines the skeleton of every authenticated page: navbar → content area → footer. Individual pages fill in the content area via `<Outlet />`. The page provides the body; AppLayout provides the structure. `PublicLayout` applies the same pattern for public auth pages, providing the full-screen centering wrapper.

```text
AppLayout (template)
├── <Navbar /> — fixed structure
├── <main>
│   └── <Outlet /> ← page fills this
└── <footer> — fixed structure
```

### 5.7 Command Pattern (Zustand actions)

Store actions are commands — named, encapsulated operations that mutate state. Callers dispatch commands without knowing the internal mutation logic.

```js
// Caller dispatches the command
await useAuthStore.getState().login(form)

// The store owns the mutation
login: async (payload) => {
  const result = await loginRequest(payload)
  localStorage.setItem(AUTH_TOKEN_KEY, result.token)
  set({ token: result.token, user: result.user, isAuthenticated: true })
  return result
}
```

### 5.8 Null Object Pattern

`LoadingSpinner` is a null-object-style component for loading states — a component that renders "something safe" while real content isn't ready yet, preventing null-check sprawl inside the real component.

---

## 10. Writing Components

### Prefer named exports from barrels, default exports from implementations

```js
// ComponentName.jsx
const ComponentName = () => { ... }
export default ComponentName   // default export in implementation file

// index.js
export { default } from './ComponentName'   // re-export as default
```

This keeps IDE refactoring happy (named exports are easier to track) while letting callers use the short `import ComponentName from '@/components/ComponentName'` syntax.

### Props: spread what you don't use, be explicit about what you do

```jsx
// Explicit props the component cares about:
const Input = ({ className = '', ...props }) => (
  // ...props is spread — every HTML attribute works transparently
  <input className={`...base ${className}`} {...props} />
)

// Never:
const Input = ({ type, placeholder, value, onChange, ...etc }) => (
  // Enumerating HTML attributes is fragile and infinite — use spread
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
  />
)
```

### No inline styles

Use Tailwind utility classes. Inline `style={}` is allowed only for values that cannot be expressed as a utility class (e.g., dynamic `width` from a calculation). Never use inline styles for colour, spacing, or typography.

### One component per file

Never define two components in the same file. If a component needs a small local helper element, it either extracts it to `_components/` or uses a `const` inside the same file only if the helper has no state and no hooks.

### No anonymous components

```js
// Good
const Button = ({ children, ...props }) => <button {...props}>{children}</button>
export default Button

// Bad — anonymous function makes React DevTools and stack traces unreadable
export default ({ children, ...props }) => <button {...props}>{children}</button>
```

### Conditional rendering: guard clause + ternary

Prefer early-return guard clauses for loading/error states (keeps the happy path at the bottom with full context), and ternary/`&&` for inline conditions.

```jsx
// Guard clause at the top
if (isLoading) return <LoadingSpinner />
if (!user) return <Navigate to="/login" replace />

// Main render is unindented and clean
return <div>...</div>
```

For inline conditionals:

```jsx
// Ternary for two states
{
  isSubmitting ? 'Saving…' : 'Save'
}

// && for optional elements
{
  error && <p className="...">{error}</p>
}
```

Never use `&&` when the left side can be `0` — `0 && <Thing />` renders `0`. Use a ternary or convert to a boolean: `items.length > 0 && <Thing />`.

---

## 11. State Management (Zustand)

### One store per domain

| Store                  | Domain                               |
| ---------------------- | ------------------------------------ |
| `useAuthStore`         | Session, user identity, login/logout |
| `useSocketStore`       | WebSocket connection lifecycle       |
| `useGameStore`         | Match state, history, leaderboard    |
| `useChatStore`         | Rooms, messages                      |
| `useTournamentStore`   | Tournament brackets, registration    |
| `useNotificationStore` | Transient UI notifications (toasts)  |

Never put game state in `useAuthStore`. Never put auth state in `useSocketStore`. Domain lines are hard.

### Store shape: flat, explicit, no derived state stored

```js
// Good — flat, explicit
const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async (payload) => { ... },
  logout: async () => { ... },
}))

// Bad — nested state and derived values stored redundantly
const useAuthStore = create(() => ({
  auth: {
    session: {
      user: null,
      token: null,
    },
    meta: { loading: true },
  },
  // isAuthenticated should not be stored if it's just Boolean(user && token)
}))
```

### Subscribe to slices, not the whole store

```js
// Good — only re-renders when token changes
const token = useAuthStore((state) => state.token)

// Acceptable — destructuring still re-renders when any of these change
const { user, isLoading } = useAuthStore()

// Use getState() for actions (no subscription needed — actions don't change)
const { login, logout } = useAuthStore.getState()
```

### Initialisation

Stores initialise from `localStorage` synchronously (for values that should persist across reloads) and hydrate async data in an `init()` action called once in `App.jsx`'s `useEffect`. Never call `init()` in more than one place.

### Inter-store relationships

Stores are not islands. They have a defined dependency direction:

```text
useSocketStore     ← owns the connection lifecycle
    ↑                    ↑
useGameStore       useChatStore
```

`useSocketStore` holds the socket.io client and manages connect/disconnect. `useGameStore` and `useChatStore` **subscribe to socket events** but do not call `socket.connect()` or `socket.disconnect()` themselves. They receive events; they do not manage the pipe.

Rule: if store A needs data from store B, store A reads from `useB.getState()` inside its action — it does not receive store B as a prop or argument. Cross-store reads happen inside actions, never inside components (which would cause them to subscribe to both stores unnecessarily).

```js
// Inside useGameStore — reading auth token from useAuthStore
startMatch: async () => {
  const token = useAuthStore.getState().token // ← getState(), not the hook
  const match = await createMatch(token)
  set({ currentMatch: match })
}
```

---

## 12. Services

### One function per endpoint

```js
// services/auth.js
export const login = (payload) =>
  request('/auth/login', { method: 'POST', body: payload })
export const logout = (token) =>
  request('/auth/logout', { method: 'POST', token })
```

### No logic, no state, no React

Service files are pure functions that take arguments and return Promises. They do not import from stores, use hooks, or hold module-level state. The one exception is the `socket` singleton which is a client, not a service.

### Raw HTTP plumbing belongs in `utils/request/`

Error parsing, header construction, session-expired event dispatch, 204 handling — all of this lives in `utils/request/request.js`, not repeated across service files.

---

## 13. Import Convention

Use the `@/` alias everywhere. Relative imports (`../../`) are banned except inside the same folder (e.g., a component importing its own `_components/`).

```js
// Good
import Button from '@/components/Button'
import useAuthStore from '@/stores/useAuthStore'
import request from '@/utils/request'

// Bad
import Button from '../../../components/Button'
```

**Import order** (enforced by ESLint):

1. React and external packages
2. `@/` aliased imports (components, stores, hooks, services, utils)
3. Local relative imports (`./` or `../ ` within the same module)

---

## 14. Naming

| Thing               | Convention                         | Example                           |
| ------------------- | ---------------------------------- | --------------------------------- |
| Component file      | PascalCase                         | `Button.jsx`                      |
| Component folder    | PascalCase                         | `Button/`                         |
| Hook                | camelCase with `use` prefix        | `useDebounce.js`                  |
| Store               | camelCase with `use` prefix, `.js` | `useAuthStore.js`                 |
| Service file        | camelCase                          | `auth.js`, `users.js`             |
| Utility function    | camelCase                          | `request.js`                      |
| Private folder      | underscore prefix                  | `_components/`, `_utils/`         |
| CSS/style constants | SCREAMING_SNAKE_CASE               | `VARIANTS`, `STYLES`              |
| Event handlers      | `handle` prefix                    | `handleSubmit`, `handleChange`    |
| Boolean props/state | `is`/`has`/`can` prefix            | `isLoading`, `isOpen`, `hasError` |

---

## 15. What Not To Do

**Don't call services from components.** Components call store actions. Stores call services.

**Don't let a presenter read from a store.** If a component needs store data, it is a container. Either promote it to a container or pass the data down as props from the nearest container.

**Don't put layout and logic in the same component.** A component that has both `useEffect` with side effects AND more than a few Tailwind class strings is doing two jobs. Split the logic into a container component and the layout into a presenter.

**Don't prop-drill more than two levels.** If a value needs to pass through three or more components, it belongs in a store. Prop drilling this deep is a symptom of a missing abstraction.

**Don't grow a component past ~100 lines without asking why.** It almost always means it has taken on a second responsibility. Identify the second job and extract it.

**Don't put JSX in stores.** Stores are plain JavaScript. They own state and actions, never UI.

**Don't import `_components/` from outside the parent.** If you need it in two places, move it to `components/`.

**Don't use `React.FC` or TypeScript generics on every component.** This codebase is plain JavaScript. Prop types are documented via names and defaults, not type annotations.

**Don't skip the barrel.** Even if a component only has one file today, create `index.js`. It costs three seconds and future refactors thank you.

**Don't mix concerns in a single `useEffect`.** One effect, one side effect. If you're connecting a socket AND setting up an event listener, those are two effects.

**Don't store derived values in state.** If `isAuthenticated` is always `Boolean(user && token)`, compute it when needed or store it as a convenience alongside its source — but never let it drift out of sync.

**Don't use anonymous arrow functions for component definitions.** Always give the component a name; React DevTools and error stack traces depend on it.

---

## 16. Checklist Before Opening a PR

**Structure**

- [ ] Every new file is inside a named folder with an `index.js` barrel
- [ ] No relative `../../` imports — everything uses `@/`
- [ ] Private sub-components live in `_components/` inside their parent
- [ ] No logic or fetch calls directly inside a page component
- [ ] Any form with 2+ fields is extracted to `_components/FormName/`
- [ ] Any new shared component has at least two real callers (or is a documented design-system primitive)

**Container discipline**

- [ ] No presenter reads from a store
- [ ] No value prop-drills more than two levels
- [ ] No component file exceeds ~100 lines without a documented reason
- [ ] No component mixes `useEffect` side effects with dense Tailwind JSX — one or the other

**Runtime correctness**

- [ ] `useEffect` cleanup returns are present wherever listeners or timers are registered
- [ ] `key` props on all list renders use stable IDs, not array indices
- [ ] `alt` attributes on all `<img>` elements
- [ ] All async calls inside `useEffect` are wrapped in `try/catch`
- [ ] No unhandled promise rejections from event handlers

**Evaluation requirements (check on every PR that touches these)**

- [ ] `PrivacyPolicy` and `TermsOfService` pages are still linked from `Layout`'s footer
- [ ] `ErrorBoundary` still wraps `<Routes>` in `App.jsx`
- [ ] Zero browser console errors or warnings

**CI**

- [ ] No `console.log` left in committed code
- [ ] Build passes: `npm run build --prefix client`
- [ ] Lint passes: `npm run lint:client`
