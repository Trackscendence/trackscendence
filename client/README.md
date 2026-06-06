# Frontend Setup and Coding Standards

This client is a React, Vite, and Tailwind app. Frontend tooling should run from a clean clone after `npm run install:all`; no assignee-specific local setup is required.

## Commands

From the repository root:

```sh
npm run lint:client
npm run build
npm run format:check
npm run spellcheck
```

From `client/`:

```sh
npm run dev
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run build
```

## Tooling

- ESLint owns code quality checks for React, hooks, imports, promises, and regular expressions.
- Prettier owns formatting. Do not hand-format around Prettier output.
- Tailwind utility classes are sorted by `prettier-plugin-tailwindcss`.
- Husky and lint-staged run from the repository root so Git checks apply to the whole repo.
- Commit messages are checked with commitlint using the conventional commit format.
- CSpell runs from the repository root for spelling checks.

## Folder Conventions

```text
client/src/
  components/  shared reusable components used by more than one page or feature
  context/     React context providers and hooks for app-level state
  pages/       route-level screens rendered by React Router
  services/    API clients, socket clients, and browser-facing integrations
  index.css    Tailwind entry point and global base styles
  main.jsx     React root mounting only
```

Create `client/src/assets/` when imported images, fonts, or other static frontend assets are needed. Keep public files that must be served by URL in `client/public/` if Vite public assets become necessary.

## Components

- Use Pascal case for component filenames and exports, for example `LoginPage.jsx` and `ProtectedRoute.jsx`.
- Use camel case for hooks and non-component modules, for example `useAuth.js`.
- Keep route-level layout and data flow in `pages/`.
- Put reusable UI in `components/` only when it is shared or page-independent.
- Keep page-specific components near the page until they are reused; promote them to `components/` when reuse is real.
- Prefer small, accessible primitives for buttons, inputs, form fields, dialogs, feedback messages, and loading states before adding one-off markup repeatedly.

## Imports

- Prefer relative imports for nearby app files.
- Use the `@/*` alias for deeper cross-folder imports when relative paths become hard to read.
- Keep side-effect imports, such as `./index.css`, in entry files.
- Keep service modules framework-light so UI components do not duplicate fetch or socket setup.

## Styling

- Prefer Tailwind utilities for component styling.
- Keep global CSS limited to Tailwind setup, base element defaults, and truly global styles.
- Use the typography plugin for long-form content with `prose` classes.
- Reuse colors, spacing, and interaction patterns before introducing new visual rules.
