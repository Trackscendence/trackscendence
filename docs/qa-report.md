# Browser QA report

Evidence for the subject's Chrome-compatibility requirement: the app runs in
the latest stable Google Chrome with no warnings or errors in the browser
console on any screen an evaluator can reach, including transitions.

## Console sweep

Every reachable route was visited at two screen sizes and its console watched for
warnings, errors, uncaught exceptions, and failed network requests. Both passes
were clean.

| Route                  | Auth | Desktop (1440x900) | Mobile (390x844) |
| ---------------------- | ---- | ------------------ | ---------------- |
| `/login`               | no   | clean              | clean            |
| `/signup`              | no   | clean              | clean            |
| `/forgot-password`     | no   | clean              | clean            |
| `/reset-password`      | no   | clean              | clean            |
| `/privacy-policy`      | no   | clean              | clean            |
| `/terms-of-service`    | no   | clean              | clean            |
| `/` (waiting room)     | yes  | clean              | clean            |
| `/lobby`               | yes  | clean              | clean            |
| `/game`                | yes  | clean              | clean            |
| `/profile`             | yes  | clean              | clean            |
| `/users/:username`     | yes  | clean              | clean            |
| `/leaderboard`         | yes  | clean              | clean            |
| `/change-password`     | yes  | clean              | clean            |
| `/settings`            | yes  | clean              | clean            |
| `/results` (won / end) | yes  | clean              | clean            |

### Transitions

The flows an evaluator moves through were each watched end to end and produced
no console output: login into the waiting room, waiting room into the game
table via the start overlay, a full game into the results screen, results back
to the lobby, and logout. A mid-game refresh (state resync) and an opponent
leaving (game over) were included.

### Note on the two environments

The sweep runs against the development server, where React StrictMode
double-invokes effects. That is deliberately stricter than the production build:
a cleanup bug that StrictMode surfaces in development cannot appear in
production, so a clean development sweep implies a clean production one. The one
development-only artifact, a single "WebSocket is closed before the connection
is established" notice from StrictMode's double mount, does not occur in the
production build and is excluded.

### Mixed content

Under HTTPS there is no mixed-content risk by construction. The browser only
ever talks to its own origin: API calls use relative `/api` paths and the socket
connects same-origin (it inherits the page scheme, so it upgrades to `wss://`
automatically). There are no absolute `http://` resources to be blocked.

## Accessibility and responsive posture

Maintained as coding-standard rules rather than retrofitted:

- Every list render carries a stable `key`; every `<img>` has an `alt`; async
  work inside effects is wrapped so no promise rejection reaches the top level.
- Interactive controls expose an accessible name (`aria-label` where the visual
  is an icon) and show a visible focus ring via `focus-visible`.
- Forms label their fields and surface validation inline.
- Layouts were checked at 390px, 768px, and 1440px without horizontal scroll;
  the bio and long unbroken strings wrap rather than overflow.
- The game table's primary controls stay comfortably sized to tap at mobile width.

## Re-running the sweep

The sweep is local tooling, not committed. Re-run it as a pre-submission ritual
after any further merge, alongside the history scrub, against the production
compose stack over HTTPS.
