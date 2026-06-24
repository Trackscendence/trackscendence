# Storybook

Storybook is the local workshop for frontend UI primitives in `client/src/components/`.

## Why We Use Storybook

Some shared components are built before the application has a route that renders them. The UNO `Card` primitive is one example: the component needs visual review for every color, action, selected state, unplayable state, and face-down state before the game table consumes it.

Storybook gives the team a stable place to inspect those variants without adding temporary routes or debug-only UI to the app. It also supports the custom design system module by making shared primitives easy to review as standalone units.

Use Storybook when:

- A shared component has multiple visual variants or states.
- A primitive is not yet rendered by an application page.
- A visual change needs teammate review before it is wired into a user flow.
- You need to compare disabled, selected, loading, error, or empty states side by side.

## Run Storybook

From the repository root:

```sh
npm run storybook
```

Or from `client/`:

```sh
npm run storybook
```

Open:

```text
http://localhost:6006
```

## Build Storybook

Build the static Storybook bundle before sharing a branch or when checking the Storybook config:

```sh
npm run build-storybook
```

The generated `client/storybook-static/` directory is build output and should not be committed.

## Add Component Stories

Place stories beside the component they document:

```text
client/src/components/Card/
├── Card.jsx
├── Card.stories.jsx
└── index.js
```

A story should show the meaningful component states the team needs to inspect. For design system primitives, prefer an `AllVariants` story plus a controllable `Playground` story.

Keep stories focused on rendering props. They should not call real services, mutate stores, or depend on backend data.
