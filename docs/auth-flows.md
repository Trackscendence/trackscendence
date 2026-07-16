# Authentication flows and tokens

A map of every authentication flow the server supports and the token each one
uses. Traced from the route table through the controllers, service, and
`auth.token.js`. Source lives in `server/src/modules/auth/`.

## Flows

| Flow               | Supported       | Endpoint(s)                                                                        | Notes                                                                                                                      |
| ------------------ | --------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Login              | Yes             | `POST /auth/login`                                                                 | Password login; identifier is email or username. Account locks for 2 minutes after 8 failed attempts.                      |
| Signup             | Yes             | `POST /auth/register`                                                              | Creates the user and returns the user object only. No token is issued — the user logs in afterwards.                       |
| Logout             | Yes (stateless) | `POST /auth/logout`                                                                | Returns `204` and does nothing server-side. The client discards its token. There is no server-side list of revoked tokens. |
| Refresh token      | No              | —                                                                                  | Not implemented. The access token is long-lived (7 days) and there is no refresh endpoint or refresh token.                |
| Email verification | No              | —                                                                                  | Not implemented. There is no verification token and no `emailVerified` gating; accounts are usable immediately.            |
| Password reset     | Yes             | `POST /auth/forgot-password`, `POST /auth/reset-password`                          | Opaque token delivered by email, 1-hour expiry.                                                                            |
| Two-factor (2FA)   | Yes (TOTP)      | `POST /auth/login/2fa`, `POST /auth/two-factor/{setup,confirm,disable,regenerate}` | TOTP with one-time recovery codes.                                                                                         |
| 42 OAuth           | Yes (optional)  | `GET /auth/42`, `POST /auth/42/callback`                                           | Endpoints return `404` until the three `FORTYTWO_*` env vars are set.                                                      |

Additional flows not in the list above but present in the code:

- **Guest login** — `POST /auth/guest`, and guest-to-real upgrade `POST /auth/guest/upgrade`.
- **Change password** (authenticated) — `POST /auth/change-password`.
- **Socket handshake** — the Socket.io connection reuses the same access token
  (`socket.middleware.js` calls `authService.getUserFromToken`).

## Tokens

Four token types exist. Three are JWTs signed with the single symmetric
`JWT_SECRET`; the password reset token is not a JWT.

| Token                | Type          | Lifetime                                        | Claims / shape                                                                | Role                                                                                                                                     |
| -------------------- | ------------- | ----------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Access token         | JWT (HS256)   | `JWT_EXPIRES_IN`, default `7d`                  | `sub`, `role`, `tokenVersion` (no `purpose`)                                  | The only credential for protected HTTP routes and the socket handshake. Also serves as the session — there is no separate session token. |
| 2FA challenge token  | JWT (HS256)   | `TWO_FACTOR_CHALLENGE_EXPIRES_IN`, default `5m` | `sub`, `tokenVersion`, `purpose=login-2fa`, `challengeVersion`                | Bridges step 1 to step 2 of a 2FA login. Grants no access on its own.                                                                    |
| 42 OAuth state token | JWT (HS256)   | `FORTYTWO_STATE_EXPIRES_IN`, default `10m`      | `purpose=oauth-42-state`, `jti`                                               | CSRF/state value for the OAuth round-trip.                                                                                               |
| Password reset token | Opaque random | `PASSWORD_RESET_TOKEN_EXPIRES_MS`, default `1h` | `"<uuid>.<32-byte-hex-secret>"`; the secret is stored bcrypt-hashed in the DB | Single-use password reset delivered by email.                                                                                            |

Not present in the system:

- **Refresh token** — none.
- **Email-verification token** — none.
- **Session token** — none separate; the access token is the session (stateless,
  stored client-side in localStorage/cookie).

## Which token each flow uses

| Flow               | Token(s)                                                                                             | Detail                                                                                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Login (no 2FA)     | Access token                                                                                         | `login` → `buildLoginResult` → `signAccessToken`, returns `{ token, user }`.                                                                                   |
| Login (2FA on)     | 2FA challenge token, then access token                                                               | Returns `{ requiresTwoFactor, challengeToken }`; `POST /auth/login/2fa` with a TOTP or recovery code returns the access token.                                 |
| Signup             | None                                                                                                 | Returns `{ user }` only; no auto-login.                                                                                                                        |
| Logout             | None                                                                                                 | Stateless; client discards the access token.                                                                                                                   |
| Refresh token      | N/A                                                                                                  | Flow not implemented.                                                                                                                                          |
| Email verification | N/A                                                                                                  | Flow not implemented.                                                                                                                                          |
| Password reset     | Reset token (opaque)                                                                                 | `forgot-password` mails `uuid.secret`; `reset-password` verifies via bcrypt, updates the password, and bumps `tokenVersion` (revoking existing access tokens). |
| 2FA                | 2FA challenge token + TOTP/recovery code → access token                                              | The challenge token proves step 1 passed; the code proves step 2.                                                                                              |
| 42 OAuth           | OAuth state token + 42's own access token (server-side, transient) → access token (or 2FA challenge) | 42's access token is used once server-side to fetch the profile and is never sent to the client.                                                               |

## Design notes

- **Single algorithm, symmetric secret.** Everything is HS256 with one
  `JWT_SECRET`; the access token is stored client-side. This is a one-algorithm
  system by design.
- **Tokens are segregated by a `purpose` claim.** Access-token verification
  rejects any token that carries a `purpose` (`payload.purpose !== undefined`),
  and the 2FA path requires `purpose === 'login-2fa'`. A short-lived challenge or
  OAuth state token therefore cannot be replayed as a Bearer access token, even
  though all three share the secret and algorithm.
- **Revocation rides `tokenVersion`.** Password change, password reset,
  guest upgrade, and account deletion increment `tokenVersion`, which instantly
  invalidates every previously issued access token for that user. A plain
  `logout` does not bump it, so a token stays valid until it expires — this is
  the main consequence of having no refresh token and no server-side session.
- **Algorithm pinning on `verify`.** `jwt.verify` is not currently called with an
  explicit `algorithms` list. On `jsonwebtoken@9`, `alg:none` is already rejected
  when a secret is supplied and there is no asymmetric-key confusion risk here,
  but an unpinned verify still accepts HS384/HS512 tokens minted with the same
  secret. Pinning `algorithms: ['HS256']` closes that gap and is the recommended
  hardening.
