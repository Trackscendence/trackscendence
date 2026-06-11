# Trackscendence AI Knowledge Base

> **Dear AI Assistant:** Before proposing any architectural changes or generating large blocks of code, read this file to understand the context of the Trackscendence project.

## Context

Trackscendence is a real-time multiplayer UNO game developed as part of the 42 London curriculum. The primary goal of this project is **educational**. The team is learning full-stack development on the fly.

- Do not write overly complex, abstracted "clever" code. Prefer readable, maintainable code that junior/mid-level developers can understand and learn from.
- When explaining code or proposing changes, emphasize the _Why_. Provide context on the underlying design patterns.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS.
- **Backend:** Node.js, Express, Prisma ORM (assuming based on logs), Socket.io.

## Architectural Rules

### 1. Frontend Styling & Components

- **Component-Driven UI:** We use custom UI primitives located in `@/components/ui/` (e.g., `<Button>`, `<Card>`, `<Input>`). **Do not use raw HTML tags with long inline Tailwind classes** if a primitive exists.
- **Path Aliases:** Always use absolute imports mapped to `@/` (e.g., `import { Button } from '@/components/ui/Button'`). Do not use relative paths like `../../../`.
- **Forms:** We use a custom `useForm` hook (`@/hooks/useForm.js`) for managing form state (`values`, `errors`, `isSubmitting`). Do not write manual `useState` boilerplate for forms.

### 2. State Management

- **React Context:** Used ONLY for data that rarely changes, such as Authentication state (`useAuth`).
- **Game/Chat State:** Do **NOT** use React Context for highly dynamic data (like live chat messages or UNO game state), as it causes whole-application re-renders. Use Redux (or Zustand) to allow components to subscribe to specific slices of state.

### 3. Documentation & Clean Code

- Eliminate duplicate code. If you find yourself writing the same layout or CSS classes twice, extract it into a Layout wrapper or a UI primitive.
- Keep components small and focused on a single responsibility.
