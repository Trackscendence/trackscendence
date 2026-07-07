# Debug mode

Local dev tooling for finding bugs faster. Its job is to make failures visible.
A crashed API used to look like an app that was just slow to load, a dropped
socket looked the same as a quiet one, and a failed request left no trace unless
you had the network tab open. Debug mode surfaces that state, and gives you a
debugger and verbose logs when you need to go deeper.

There are four parts. Use whichever fits the problem; they work independently.

| Part               | Turn it on              | Best for                                        |
| ------------------ | ----------------------- | ----------------------------------------------- |
| Debug HUD          | Always on in dev        | Seeing live system state at a glance            |
| Honest boot screen | Always on               | Knowing the API is down instead of guessing     |
| Backend debugger   | `npm run compose:debug` | Breakpoints in server code                      |
| Structured logs    | `LOG_LEVEL=debug`       | Reading the sequence of events before a failure |

All of it is dev-only. The HUD and its diagnostics sit behind
`import.meta.env.DEV`, so they are stripped from production builds. The debugger
and verbose logs are opt-in and never run in the deployed stack.

## Debug HUD

A panel in the running app that shows live system state. Start the dev stack
(`npm run compose:dev`) and open http://localhost:5173. A **Debug** button sits
in the bottom-left corner. Click it to open the panel, click the `—` button to
collapse it back to the launcher, and press `Ctrl+I` to hide or re-summon it
entirely.

The dot on the launcher is a worst-of summary of the rows below, so a collapsed
HUD still warns you when something is wrong. Green is fine, amber is degraded (a
slow API, an offline socket, or a failed request), red is broken.

Rows:

| Row    | Shows                                    | Green / amber / red                  |
| ------ | ---------------------------------------- | ------------------------------------ |
| API    | Health-check round trip, polled every 5s | ok / slow (>500ms) / down            |
| Socket | Live socket connection                   | connected / offline                  |
| Auth   | Current session                          | signed-in user and role / signed out |
| Rooms  | Open room count and lobby size           | always neutral                       |
| Game   | Live game id and whose turn it is        | in a game / none                     |
| Errors | Rolling log of what failed               | see below                            |

The Errors section captures three things as they happen, whether or not the
panel is open:

- Uncaught errors thrown anywhere in the app
- Unhandled promise rejections
- Failed API requests (status, method, path, and the server's message)

The log keeps the last 50 entries and drops the oldest, so it cannot grow
without bound during a long session. **clear** empties it.

When something breaks, open the HUD first. A red API row means the server is
down or unreachable. An offline socket with a healthy API points at the socket
handshake, not the backend. A failed request in the log gives you the exact
status and message without digging through the network tab.

## Honest boot screen

The app checks the API is reachable before it renders. While that check runs you
see "Waking the table...", and once the API answers the app loads normally. The
part that matters is what happens when the API does not answer.

The check retries with backoff for about 28 seconds. If the API is genuinely
down, it stops and shows **Cannot reach the server** with the number of attempts
made, the underlying error, and a **Retry** button. This is the difference
between a loading screen that spins forever and one that tells you the server
crashed. Retry restarts the check once the server is back, with no page reload.

If you hit this screen, check that the server container is up
(`docker compose -f compose.yaml -f compose.dev.yaml ps`) and read its logs.

## Backend debugger

Run the backend under the Node inspector so you can set breakpoints and step
through server code.

```bash
npm run compose:debug
```

This layers `compose.debug.yaml` over the dev stack. It runs the server with
`--inspect` on port `9229` and also sets `LOG_LEVEL=debug` (see below), so you
get breakpoints and verbose logs together. It runs the server directly instead
of under `node --watch`, because the watcher restarts the process on every save
and drops the debug session with it. While debugging, restart the stack by hand
after a server change.

Attach a debugger to `localhost:9229`:

- **Chrome or Edge:** open `chrome://inspect`. The target appears under "Remote
  Target"; click "inspect".
- **VS Code:** add this to `.vscode/launch.json` and run it:

  ```json
  {
    "type": "node",
    "request": "attach",
    "name": "Attach to server",
    "port": 9229,
    "address": "localhost",
    "localRoot": "${workspaceFolder}/server",
    "remoteRoot": "/app",
    "skipFiles": ["<node_internals>/**"]
  }
  ```

Confirm the inspector is listening:

```bash
curl -s http://localhost:9229/json/version
```

Return to the normal dev stack with `npm run compose:dev` (or
`npm run compose:debug_down` to stop the debug stack).

## Structured logs

Set `LOG_LEVEL=debug` to make the server log the events that are otherwise
silent. `npm run compose:debug` sets it for you. To get the logs on the normal
dev stack without the debugger, set `LOG_LEVEL=debug` in `.env` and restart.

On top of the usual HTTP request logs, debug level adds:

- **Socket events.** Every inbound event, logged once as it arrives, with the
  user and the payload's keys. One tap covers all events, so a misbehaving
  client is legible without reading through every handler.
- **Game-store mutations.** Every save, delete, and engine set or delete, each
  carrying the current size of the in-memory maps. A store that keeps growing
  after games end is the shape of a leak, and this shows it as it happens rather
  than after the process runs out of memory.

Log levels follow winston's order, so `debug` includes everything at `info` and
above. Leave `LOG_LEVEL` unset (or `info`) for normal, quieter dev.

## A note on the dev stack

The dev containers reinstall dependencies and run migrations on boot. Both steps
are retried and fall back to what is already installed, so a flaky network or a
database still warming up does not kill the whole stack on startup. If the
server exits on boot, its logs show the real reason instead of a transient
install or connection error taking the process down with it.
