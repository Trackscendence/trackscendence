# System Architecture

This document gives a quick technical map of Trackscendence for new
contributors. It complements the database ERD in `docs/ERD.md` and the
frontend-specific rules in `docs/frontend-coding-standards.md`.

## System topology

```mermaid
flowchart LR
  browser[Browser]
  nginx[Nginx or Vite dev server]
  client[React client]
  backend[Backend process]
  api[REST routes]
  socket[Socket.IO handlers]
  uploads[Uploaded files]
  db[(PostgreSQL)]
  mail[Mailpit or SMTP]
  oauth[42 OAuth]
  adminer[Adminer]

  browser --> nginx
  nginx --> client
  nginx -->|/api/v1/*| backend
  nginx -->|/websocket/*| backend
  nginx -->|/uploads/*| backend

  backend --> api
  backend --> socket
  backend --> uploads

  api --> db
  api --> mail
  api --> oauth
  socket --> db
  adminer --> db
```

In development, Vite serves the React app and proxies `/api`, `/websocket`, and
`/uploads` to the server container. In the production-style compose stack, Nginx
serves the built React app and performs the same routing. The backend owns both
REST and WebSocket behavior, with PostgreSQL as the durable store.

## Backend dependency layers

```mermaid
flowchart TD
  app[app.js]
  routes[routes/v1]
  moduleRoutes[module routes]
  controller[controller]
  service[service]
  repository[repository]
  prisma[Prisma client]
  database[(PostgreSQL)]
  exceptions[typed exceptions]

  app --> routes
  routes --> moduleRoutes
  moduleRoutes --> controller
  controller --> service
  service --> repository
  repository --> prisma
  prisma --> database
  service --> exceptions
```

Controllers only validate request shape and translate service results into HTTP
responses. Services own business rules, security checks, and exception throwing.
Repositories own Prisma queries and must use explicit `select` objects when
returning user data.

## Realtime game layers

```mermaid
flowchart TD
  socketClient[client socket service]
  socketStore[useSocketStore]
  socketHandlers[socket handlers]
  roomService[room service]
  matchmaking[matchmaking service]
  gameStore[in-memory game store]
  engine[UNO engine]
  gameRepo[game repository]
  postgres[(PostgreSQL)]

  socketStore --> socketClient
  socketClient --> socketHandlers
  socketHandlers --> roomService
  socketHandlers --> matchmaking
  matchmaking --> gameStore
  matchmaking --> engine
  socketHandlers --> engine
  socketHandlers --> gameRepo
  gameRepo --> postgres
  roomService --> postgres
```

Open rooms are durable records in PostgreSQL. Running game engines live in the
in-memory game store while a match is active, then completed or abandoned results
are flushed to PostgreSQL.

## Frontend dependency layers

```mermaid
flowchart TD
  route[Route]
  page[Page container]
  feature[Feature container]
  presenter[Presenter component]
  store[Zustand store]
  service[Service function]
  request[request utility]
  api[REST API]
  socketService[Socket service]
  socketApi[Socket.IO API]

  route --> page
  page --> feature
  feature --> presenter
  page --> store
  feature --> store
  store --> service
  service --> request
  request --> api
  store --> socketService
  socketService --> socketApi
```

Pages and feature containers may read stores. Presenters receive props and render
markup. Components do not call services directly; the normal path is component to
store action to service to `request`.

## Ownership boundaries

| Area            | Owns                                  | Does not own                              |
| --------------- | ------------------------------------- | ----------------------------------------- |
| React page      | Routing, store reads, high-level flow | Raw API calls                             |
| Store           | Client state and async actions        | DOM rendering                             |
| Service         | Endpoint shape                        | UI state                                  |
| Controller      | HTTP request and response mapping     | Business rules                            |
| Service layer   | Business rules and validation         | Raw SQL/Prisma query details              |
| Repository      | Database queries                      | Password checks, JWTs, UI payload shaping |
| Socket handlers | WebSocket event orchestration         | Engine rules                              |
| Game engine     | UNO turn rules                        | Persistence or sockets                    |
