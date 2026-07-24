# Room ERM

This note explains the database shape for the lobby feature (`#185`) and why `Room` is modeled as its own entity with an explicit `RoomPlayer` join table, following the same reasoning as `friendship.md`.

## ERM

```mermaid
erDiagram
    User ||--o{ Room : owner
    User ||--o{ RoomPlayer : seats
    Room ||--o{ RoomPlayer : players

    User {
        int id PK
        string email
        string username
        datetime createdAt
        datetime updatedAt
    }

    Room {
        int id PK
        string name
        int capacity
        enum status
        int ownerId FK
        string gameId nullable
        datetime createdAt
        datetime updatedAt
    }

    RoomPlayer {
        int id PK
        int roomId FK
        int userId FK
        datetime createdAt
    }
```

## Why this is not just the in-memory queue

The matchmaking queue (`lobby.store.js`) answers "who is waiting right now" and is deliberately volatile. A room answers questions that outlive a socket connection:

- who created the gathering and therefore owns it
- how many seats it has (2 today, but 3, 4 or 6 player rooms render from the same field)
- its lifecycle state: `OPEN`, `IN_GAME`, or `CLOSED`
- who is seated, in join order

Because "only one player can own the open room, everyone else joins" is a rule about ownership, it needs a durable record with an `ownerId`, not a position in a queue.

## Field meanings

- `capacity`: number of seats; a room starts its game when all seats fill
- `status = OPEN`: accepting players
- `status = IN_GAME`: seats are locked, a game is running
- `status = CLOSED`: history; never shown in the lobby
- `ownerId`: the creator, or the earliest remaining joiner if the creator left
- `gameId`: the runtime game UUID, not a foreign key. Live games exist only in memory until they end (see `../adr/0001-in-memory-game-state.md`), so there is no `Game` row to reference while the room is `IN_GAME`. The id lets the server close the room when that game finishes or is abandoned.

## Cardinality

- One `User` can own many rooms over time, but at most one `OPEN` room (service rule, not a constraint, so the limit can grow later).
- One `Room` has 1..capacity `RoomPlayer` rows; the owner always holds one.
- The same (roomId, userId) pair can exist only once.

## Integrity rules

- `(roomId, userId)` is unique, so a player cannot take two seats in one room.
- Capacity bounds come from the game engine's `GAME_RULES` (2..6) and are enforced in the service.
- Seat counting and seat taking happen in one serializable transaction, so two players racing for the last seat cannot both win it.
- Deleting a user cascades to their memberships and owned rooms.
