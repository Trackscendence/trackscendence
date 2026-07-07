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
- `server/benchmarks/e2-leaderboard.js` — leaderboard query cost (needs a seeded DB).
- `server/benchmarks/e3-game-store-memory.js` — in-memory game-store cost.
- `server/prisma/seed.bench.js` — scale seed (users, and optionally games).
- `benchmarks/results/` — JSON output written by the experiments.

Run from the repo root:

```bash
npm run bench           # E1 + E3 (the two that need no database)
npm run bench:e1        # bundle size; builds the client, then measures
npm run bench:e3        # game-store memory/scan
SEED_SCALE=10000 SEED_GAMES=200000 npm run bench:seed   # volume for E2/E5/E6
npm run bench:e2        # leaderboard aggregation vs denormalized (after seeding)
```

## Experiments and status

| Exp | Finding | Measures                                                | Status               |
| --- | ------- | ------------------------------------------------------- | -------------------- |
| E1  | F1, F2  | Initial-route JS (gzip), per-chunk sizes, budget gate   | Done. Shows the win. |
| E2  | B3, I6  | Leaderboard plan + latency, aggregation vs denormalized | Done. Shows target.  |
| E3  | B1      | activeGames size, scan latency, RSS over N games        | Done. Shows the win. |
| E4  | B5      | rooms_update recipients/bytes + event-loop delay        | Planned (baseline).  |
| E5  | B4      | Prisma pool wait + error rate under load                | Planned (baseline).  |
| E6  | F3      | Profile load request count + wall-clock                 | Planned (baseline).  |
| E7  | F5      | Game-table re-renders per update, INP                   | Planned (baseline).  |
| E8  | —       | CI bundle-size budget gate                              | Planned.             |

Honest reading: E1 and E3 measure work that already merged (route/vendor
splitting; the game-store leak fix), so they show real improvements now. E2
measures B3's target query directly (the fix is not shipped yet), so it shows how
much is on the table. E4/E5/F5 are still open in the audit, so those experiments
land as baselines and get their "after" once B4/B5/F5 ship. Graceful shutdown (a
prerequisite E5 touches) already merged separately.

## E2 — leaderboard aggregation vs denormalized

`bench:e2` needs a seeded database (`SEED_SCALE=10000 SEED_GAMES=200000
npm run bench:seed`). It `EXPLAIN ANALYZE`s the current endpoint query (JOIN
GamePlayer + GROUP BY, sorted by a computed aggregate) against B3's proposed read
straight from the denormalized `User` columns, plus the two count queries, and
reports median execution time and the plan's top node.

At 10k users / 400k game-player rows: the page query drops from ~31 ms to ~1.2 ms
(about 26x) and the pagination count from ~52 ms to ~0.7 ms (about 78x). The
endpoint runs both per request, so the denormalized read removes almost all of
the current per-request database cost.

Caveat: the denormalized columns cover `wins`, `gamesPlayed`, and `rank` (the
default board sort). The `totalScore` and `winRate` sort modes are not
denormalized, so shipping B3 in full either denormalizes those too or keeps the
aggregation for just those sorts. E2 measures the common default sort.

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
