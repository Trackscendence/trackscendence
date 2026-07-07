# Performance benchmark harness

Runnable experiments for the findings in
`spec/260706-architecture-perf-audit.md` (E1 to E8). Each one is a falsifiable
before/after so a claimed optimization can be proven rather than asserted.

## Protocol

Every experiment follows the audit's fair-benchmark rules: change one variable,
pin the environment, discard warm-up runs, run enough iterations, and report the
distribution (not an average). Railway is a shared host, so re-run anything that
looks close before trusting it. Most database and socket experiments only bite
at volume, so seed with `bench:seed` first.

## Layout

- `benchmarks/e1-bundle.mjs` — client bundle sizing (Node, uses the Vite manifest).
- `server/benchmarks/e3-game-store-memory.js` — in-memory game-store cost.
- `server/prisma/seed.bench.js` — scale seed (users, and optionally games).
- `benchmarks/results/` — JSON output written by the experiments.

Run from the repo root:

```bash
npm run bench           # E1 + E3 (the two that need no database)
npm run bench:e1        # bundle size; builds the client, then measures
npm run bench:e3        # game-store memory/scan
SEED_SCALE=10000 SEED_GAMES=250000 npm run bench:seed   # volume for E2/E5/E6
```

## Experiments and status

| Exp | Finding | Measures                                                    | Status               |
| --- | ------- | ----------------------------------------------------------- | -------------------- |
| E1  | F1, F2  | Initial-route JS (gzip), per-chunk sizes, budget gate       | Done. Shows the win. |
| E3  | B1      | activeGames size, scan latency, RSS over N games            | Done. Shows the win. |
| E2  | B3, I6  | Leaderboard plan + p95 latency, aggregation vs denormalized | Planned (baseline).  |
| E4  | B5      | rooms_update payload bytes + fan-out (recipients)           | Done; B5 shipped.    |
| E5  | B4      | Prisma pool acquire-wait + timeout rate under load          | Done; B4 shipped.    |
| E6  | F3      | Profile load request count                                  | Done; F3 shipped.    |
| E7  | F5      | Game-table card re-renders per update                       | Done; F5 shipped.    |
| E8  | —       | CI bundle-size budget gate                                  | Done (wired in CI).  |

Honest reading: E1, E3, and E8 measure or guard work that already merged
(route/vendor splitting; the game-store leak fix; the bundle budget). E4 and E5
were baselines that B5 and B4 now realize: B5 scopes the room broadcast to lobby
watchers (the watchers-only fan-out E4 modelled), and B4 tunes the pool as the
app default (the large-pool condition E5 measured). E6 and E7 are measured
before/after for the F3 and F5 fixes (see below). E2 remains the open baseline
until B3 ships the denormalized leaderboard endpoint.

## E1 — initial-route JS

`bench:e1` builds the client, reads `dist/.vite/manifest.json`, and follows the
entry chunk's static-import graph (route pages are dynamic imports, so they are
excluded from the initial payload). It reports the initial shell, the /login
route total, and the largest chunks, and exits non-zero over the budget
(`--budget-kb`, default 170). Gzip is level 9, so a level-6 CDN will be slightly
larger.

## E3 — game-store memory and scan

`bench:e3` drives the real `game.store` through many start/finish cycles and
samples `activeGames` size, `findActiveGameByUser` latency, and RSS. Run it twice
to see the B1 fix:

```bash
npm run bench:e3 -- --games=5000            # FIXED: size ~0, scan flat
npm run bench:e3 -- --games=5000 --leak     # pre-fix: size and scan grow linearly
```

## E4 — rooms_update broadcast fan-out

`bench:e4` seeds N rooms of P players, then measures the three costs B5's fix
removes: `listRooms()` latency (the query + DTO map that runs on every
broadcast), the serialized payload of one `rooms_update`, and the fan-out
(payload × recipients) for the current `io.emit` to all sockets versus a scoped
`io.to('rooms')` to lobby watchers. It seeds its own rooms and removes them on
exit. Needs `DATABASE_URL`.

```bash
npm run bench:e4 -- --rooms=100 --players=4 --sockets=500 --watchers=20
```

At 100 rooms × 4 players the snapshot is ~49 KB, so one broadcast to 500 sockets
pushes ~24 MB while a scoped broadcast to 20 watchers pushes ~1 MB — a 25× cut,
and a no-op re-seat pushes the full 24 MB today for zero state change.

## E5 — Prisma connection-pool saturation

`bench:e5` fires a burst of concurrent queries that each hold a pooled
connection, at an untuned-small pool versus a tuned-larger one, and reports
acquire-wait percentiles (latency − hold time) and the `pool_timeout` (P2024)
error rate. It shows what B4's explicit `connection_limit` buys before the auth
cache even lands. No data is created. Needs `DATABASE_URL`.

```bash
npm run bench:e5 -- --concurrency=50 --hold-ms=50 --small-pool=2 --large-pool=16
```

A pool of 2 under 50 concurrent queries shows a ~1 s p95 acquire-wait and a
double-digit-percent timeout rate; a pool of 16 collapses the wait and drops
timeouts to zero at the same burst.

## E8 — CI bundle-size budget gate

E8 is not a script but the E1 gate wired into CI: the `Client Bundle Budget` job
in `.github/workflows/ci.yml` runs `node benchmarks/e1-bundle.mjs
--budget-kb=170`, which builds the client and exits non-zero when the
initial-route JS exceeds the budget, so a bundle regression fails the build
instead of shipping silently. Reproduce it locally with:

```bash
npm run bench:e1 -- --budget-kb=170
```

## E6 — profile load request count (browser)

E6 counts the REST calls a cold `/profile` load fires, before and after F3.
Because Playwright is not a repo dependency (see the browser-verification notes),
the measurement runs from a pinned Playwright script against the `compose:dev`
stack rather than a committed benchmark: log in as the seed `dev` account,
navigate to `/profile`, and record the profile-domain requests (`/users/me`,
`/friends`, `/friends/requests`, `/game/leaderboard`).

Measured: a cold load dropped from **4 distinct profile calls to 3** (F3 removes
the dead `/friends/requests`), and the leaderboard is now fetched with `limit=5`.
The 30s freshness guard is covered by `profileStore.currentProfileLoader.test.js`
(a warm re-nav within the window fires no calls).

## E7 — game-table re-renders per update (browser)

E7 counts how many card and slot components re-render per `game_state_update`,
before and after F5. The components carry a dev-only render counter
(`client/src/dev/renderCounter.js`, tree-shaken from production) that increments
`window.__renderCounts`. A pinned Playwright script logs in, turns on the dev
Rig's client-side game simulation (no socket bot needed), and samples the
counter across a window of live play.

Measured over the same sim (~10 updates): leaf `Card` re-renders dropped from
**126 to 22** — roughly **12.6 to 2.2 card re-renders per update, ~5.7x fewer**.
`OpponentSlot` stays at one render per update because an opponent's `cardCount`
changes each turn (the comparator correctly re-renders it), and `PlayerHand`
(not memoized by design) tracks the update count. The "before" number is taken by
temporarily removing the `memo` wrappers on the same sim.
