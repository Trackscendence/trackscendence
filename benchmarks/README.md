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
| E4  | B5      | rooms_update recipients/bytes + event-loop delay            | Planned (baseline).  |
| E5  | B4      | Prisma pool wait + error rate under load                    | Planned (baseline).  |
| E6  | F3      | Profile load request count + wall-clock                     | Planned (baseline).  |
| E7  | F5      | Game-table re-renders per update, INP                       | Planned (baseline).  |
| E8  | —       | CI bundle-size budget gate                                  | Planned.             |

Honest reading: E1 and E3 measure work that already merged (route/vendor
splitting; the game-store leak fix), so they show real improvements now. E2/E4/E5
and F5 are still open in the audit, so those experiments land as baselines and
get their "after" once B3/B4/B5/F5 ship. Graceful shutdown (a prerequisite E5
touches) already merged separately.

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
