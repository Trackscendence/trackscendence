# Deployment runbook (Railway)

How Trackscendence is deployed, how the CD pipeline ships it, and how to operate
both environments. Staging is live. Production is planned but not stood up yet;
the "Going to production" section below is the checklist for when you are ready.

## Model

One Railway project (`Trackscendence`) with two environments:

| Environment  | Branch | Image tag | Postgres | Status                                      |
| ------------ | ------ | --------- | -------- | ------------------------------------------- |
| `Staging`    | `dev`  | `:dev`    | its own  | live at `trackscendence-stg.up.railway.app` |
| `Production` | `main` | `:main`   | its own  | not created yet (deferred)                  |

Each environment has its own `server`, `client`, and Postgres. Staging data and
production data never mix.

## How CD works

Defined in `.github/workflows/cd.yml`.

- Push to `dev`:
  1. `build-and-push-dev` builds both Docker images and pushes `:dev` (and a `:<sha>` tag) to GHCR.
  2. `deploy-staging` runs `railway redeploy --from-source` for `server` then `client`, so Railway pulls the images just pushed.
- Push to `main`:
  1. `mirror-to-main` pulls the `:dev` images and re-tags them `:main` and `:latest`.
  2. `deploy-production` runs `railway redeploy --from-source` for the production `server` then `client`.

`--from-source` matters: plain `railway redeploy` (and the dashboard "Redeploy" button) restart the _existing_ deployment with the old image digest and never pick up a new tag.

Auth for the deploy steps comes from repo secrets `RAILWAY_TOKEN_STAGING` and
`RAILWAY_TOKEN_PRODUCTION` (Railway project tokens, each scoped to one
environment). There is no manual approval gate; a merge to `main` deploys
production automatically.

## Service configuration

Only the `client` gets a public domain. It reverse-proxies `/api` and
`/websocket` to `server` over Railway's private network.

### server (private)

| Variable                       | Value                                                           |
| ------------------------------ | --------------------------------------------------------------- |
| `DATABASE_URL`                 | `${{Postgres.DATABASE_URL}}` (reference to this env's Postgres) |
| `JWT_SECRET`                   | 64-hex random, unique per environment                           |
| `TWO_FACTOR_ENCRYPTION_SECRET` | 64-hex random, unique per environment                           |
| `NODE_ENV`                     | `production` (in every deployed environment, including staging) |
| `PORT`                         | `3001`                                                          |
| `CORS_ORIGIN`                  | the client's public URL for this environment, no trailing slash |

Generate a secret with:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Persistent uploads volume (required)

Avatar uploads are written to disk at `/app/uploads` (see `UPLOADS_ROOT_DIR` in
`server/src/modules/users/users.avatar.js`). Railway container filesystems are
ephemeral, so without a volume every redeploy wipes the uploaded files while the
database keeps its `avatarUrl` references, and every avatar 404s afterwards.
Locally this never shows up because `compose.yaml` mounts the `server_uploads`
named volume at the same path.

Attach a volume to the `server` service, in each deployed environment:

```
railway volume add -m /app/uploads   # run with the server service linked
```

Or in the dashboard: the `server` service, New Volume, mount path `/app/uploads`.
The app creates the `avatars/` subdirectory on boot, so no other setup is needed.

Note this ties the `server` service to a single instance (Railway volumes are not
shared across replicas). That is acceptable for now; moving avatars to object
storage is the path to horizontal scale later.

After the volume is attached, clear any avatar references that were already lost
to earlier redeploys so those users show the initials fallback instead of a
broken image:

```
railway run npm --prefix server run prune:avatars   # add --dry-run first to preview
```

### client (public)

| Variable       | Value                     |
| -------------- | ------------------------- |
| `BACKEND_HOST` | `server.railway.internal` |
| `BACKEND_PORT` | `3001`                    |

The server service must be named exactly `server`, because the private hostname
`server.railway.internal` is derived from the service name.

Leave `ENABLE_TLS` unset on the client. Railway terminates HTTPS at its own edge
and forwards plain HTTP to the container, so the client's TLS toggle (#60) must
stay off here; the entrypoint then serves plain HTTP on 8080 and never generates
a certificate. `ENABLE_TLS=1` and `CLIENT_HTTPS_PORT` are set only in the local
`compose.yaml`, where nginx does its own TLS termination.

## Going to production

Production is deferred on purpose. You can start mirroring `dev` into `main`
once all of these are true:

1. Staging has been exercised for the release you intend to ship (sign up, log in, play a game) and is stable.
2. You have decided to run and pay for a second always-on environment.
3. `RAILWAY_TOKEN_PRODUCTION` is set in repo secrets (already done).

Then bootstrap production once. There is a chicken-and-egg: production services
need the `:main` image, but `:main` only exists after the first promotion.

1. Merge `dev` into `main` once. `mirror-to-main` builds `:main`/`:latest`. `deploy-production` will fail this first time because the services do not exist yet; that is expected.
2. In the `Production` environment, create `server` and `client` from the `:main` images (same steps as staging), add a Postgres, and set all the variables above with production's own secrets and the production client's public URL as `CORS_ORIGIN`.
3. Verify production the same way as staging (see below), then future `main` pushes deploy automatically.

## Verifying a deploy

```
curl https://<client-domain>/api/v1/ping     # expect 200 {"message":"pong"}
curl https://<client-domain>/api/v1/health   # expect 200 {"status":"ok","database":"connected"}
```

`ping` proves the client can reach the server over private networking; `health`
proves the server can reach Postgres.

## Railway CLI

Authenticated commands need `railway login` (browser) or a token. Link to a
service, then read logs or redeploy:

```
railway link -p Trackscendence -e Staging -s server
railway logs -d --lines 40 --service server
railway redeploy --service server --from-source --yes
railway variable set KEY=value --service client
```

## Troubleshooting

Problems we have actually hit, and what caused them:

- **Server crash-loops with Prisma P1012 "URL must start with postgresql://"** — `DATABASE_URL` is empty or the wrong reference. Use `${{Postgres.DATABASE_URL}}` (the option with the Postgres icon), not the bare `${{DATABASE_URL}}` self-reference and not `DATABASE_PUBLIC_URL`.
- **Client loads but every `/api` returns 502** — the server is not reachable over the IPv6 private network. The server must listen on `::` (see `server/index.js`), and the client `BACKEND_PORT` must be a clean number (a stray `$3001` breaks the nginx proxy).
- **`/api` hangs, then nginx logs 499** — the client cached a server IP that went stale after a server redeploy. This is handled by the runtime `resolver` in `client/default.conf.template`; if it recurs, confirm `NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1` is set in the client Dockerfile.
- **Deploy said success but the app didn't change** — the redeploy restarted the old image. Confirm the step uses `railway redeploy --from-source`.
- **"The image ... :main could not be found"** — `:main` does not exist yet. Promote `dev` to `main` once to create it (see "Going to production").
