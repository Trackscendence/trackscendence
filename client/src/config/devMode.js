// The single dev/mock switch for the frontend.
//
// DEV_MODE is true only when running the Vite dev server (`npm run dev`, or the
// client service in compose.dev.yaml). During `vite build` — which every deploy
// runs, including staging (the dev branch) and production — Vite statically
// replaces `import.meta.env.DEV` with `false`, so any `if (DEV_MODE)` branch and
// the mock data it guards are dead-code-eliminated from the shipped bundle.
//
// Gate mock data behind this flag instead of checking `import.meta.env.DEV`
// directly, so there is one named place to reason about (and later extend) the
// dev experience.
//
// Note: this is for UI that has no backend to hit yet. Data that a real endpoint
// or socket can serve should come from the backend (see server/prisma/seed.js) —
// a frontend fallback there would mask backend failures instead of surfacing
// them.
export const DEV_MODE = import.meta.env.DEV
