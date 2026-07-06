# ADR 0001: Live game state is single-process and in-memory

## Status

Accepted

## Context

Active UNO games are held in `server/src/modules/game/game.store.js`, which keeps
two registries:

- **Game state** (`activeGames`): plain, serializable snapshots of a game
  (`id`, `status`, `players`, `winner`, timestamps).
- **Engine registry** (`activeEngines`): live `UnoEngine` instances holding the
  full deck, every player's hand, and turn state.

The store advertises a "seamless swap to Redis" via async accessors. That
promise only holds for serializable data. `UnoEngine` instances are not
serializable (methods, private hands, RNG-shuffled deck), so they cannot move to
Redis as-is.

## Decision

We accept, for now, that **live games run in a single Node process and are held
in memory**:

- Game state accessors stay async so `activeGames` can move to Redis later
  without touching callers.
- The engine registry stays **sync** and **process-local**. Keeping it sync
  makes the boundary explicit instead of implying a persistence guarantee it
  cannot keep.
- A server restart loses in-progress games. Completed games are already flushed
  to PostgreSQL, so only live sessions are affected.
- The engine is the source of truth for in-progress dynamics (turn, hands,
  winner). `activeGames` mirrors only durable metadata; the two are reconciled
  at game end before the flush to PostgreSQL.

## Consequences

- Horizontal scaling of live games needs a follow-up: a shared engine host, or a
  serializable engine plus sticky sessions.
- Mid-game disconnects are handled by marking the game `ABANDONED` and dropping
  its engine (see `matchmaking.handlePlayerDisconnect`), which the post-game
  abandoned/disconnected state (#155) will build on.
