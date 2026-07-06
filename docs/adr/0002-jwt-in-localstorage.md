# ADR 0002: JWT stays in localStorage with a Bearer header

## Status

Accepted (revisit on the triggers below)

## Context

The client stores its JWT in `localStorage` under `trackscendence.auth.token`
and sends it as `Authorization: Bearer <token>`. Everything follows this one
pattern: `useAuthStore` reads and writes the key, `utils/request` attaches the
header, and the Socket.io handshake authenticates from `auth: { token }`.

A security review (issue #112) flagged the standard concern: a token in
`localStorage` is readable by any JavaScript running on the page, so a
cross-site scripting (XSS) bug would let an attacker exfiltrate it. Moving the
token into an `httpOnly` cookie removes it from JavaScript's reach and closes
that path.

The move is not free. It would:

- add CSRF exposure, since cookies ride along on every request, so it needs
  `SameSite=Strict` plus server-side `Origin` header checks on mutating routes;
- change the server to set and clear the cookie and stop reading the
  `Authorization` header;
- rework the Socket.io handshake, which today authenticates from an explicit
  token rather than a cookie;
- touch `utils/request`, `useAuthStore`, `services/socket`, and the
  `ChangePassword` flow, all of which assume a readable token.

## Decision

Keep the token in `localStorage` with a Bearer header for now, and document the
trade-off rather than migrate.

The deciding factor is the actual XSS surface. Token theft through
`localStorage` requires an XSS hole to exist first, and the client has none of
the usual sources: there is no `dangerouslySetInnerHTML`, no `innerHTML`
assignment, and no `eval` anywhere in `client/src`. Every value rendered goes
through React, which escapes by default. With no injection vector, the
`localStorage` risk is theoretical, while the cookie migration adds real CSRF
machinery and reworks the socket auth that is currently clean and stateless.

## Consequences

- Auth stays simple: one token, one header, one handshake shape, and a refresh
  survives without a server round-trip.
- We accept that if an XSS hole is ever introduced, the token is reachable. We
  hold the line on the surface instead: the #72 QA pass checks that no screen
  renders raw HTML, HTTPS at the edge (#60) keeps the token off the wire in
  clear text, and changing a password bumps `tokenVersion`, which invalidates
  every existing token immediately.
- Revisit this decision if any of these land: rendering user-generated HTML or
  a rich-text field, embedding third-party scripts, or a requirement for
  cookie-based sessions from the evaluation. At that point the XSS surface
  stops being empty and the cookie approach earns its cost.
