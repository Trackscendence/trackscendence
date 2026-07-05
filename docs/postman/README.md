# Postman Collections

This folder contains documentation for local Trackscendence Postman checks.

The actual Postman collections and environments now live in `tests/postman/`.

Recommended taxonomy for future additions:

- `tests/postman/<domain>/<feature>/`

Current structure:

- `tests/postman/auth/security/`
- `tests/postman/users/avatar/`
- `tests/postman/users/profile/`
- `tests/postman/friends/friendship/`

Each collection keeps reusable test variables in a matching environment file, so the collection JSON stays generic and easy to rerun.

## Auth Security

Import:

- `tests/postman/auth/security/trackscendence-auth-security.postman_collection.json`
- `tests/postman/auth/security/trackscendence-auth-local.postman_environment.json`

Recommended usage:

1. Select the imported environment named `Trackscendence Auth Local`.
2. Run `01 Initialize / Initialize Test Variables`.
3. Run the remaining requests top-to-bottom, or run the full collection in order.

Coverage:

- register, login, and `/auth/me`
- password change flow
- forgot/reset password flow with Mailpit
- single-use reset token check
- weak-password and validation guards

Notes:

- The collection assumes the Docker production-style stack is running on `http://localhost:8080`.
- Mail-based reset testing uses Mailpit on `http://localhost:8025`.
- The collection now covers register/login, TOTP 2FA setup, recovery-code login, disable/regenerate 2FA, password change, and forgot/reset-password flows.
- TOTP codes are generated inside Postman from the setup secret, so you can demo the full 2FA API flow without manually opening an authenticator app.
- The collection auto-saves `token`, `oldToken`, `challengeToken`, `twoFactorSecret`, `recoveryCode`, `messageId`, `resetToken`, and `resetLink`.
- Run the collection in order if you want the full end-to-end scenario: it enables 2FA, verifies login with a second factor, disables 2FA again, and then continues into the password-reset checks.
- UI-only behavior such as redirecting on expired sessions is not covered by Postman.

## Profile And Stats

Import:

- `tests/postman/users/profile/trackscendence-profile-stats.postman_collection.json`
- `tests/postman/users/profile/trackscendence-profile-local.postman_environment.json`

Recommended usage:

1. Select the imported environment named `Trackscendence Profile Local`.
2. Run `01 Initialize / Initialize Profile Variables`.
3. Run the rest of the requests top-to-bottom, or run the full collection in order.

Coverage:

- public profile lookup via `GET /api/v1/users/:username`
- protected self-update via `PATCH /api/v1/users/me`
- zero-state lifetime stats contract for new users
- public/private field exposure checks
- username validation for public profile lookups
- profile-field normalization, trimming, and clearing to `null`
- validation and auth guards for profile updates

Variables stored in the separate environment file:

- base URL
- generated owner/opponent identities
- auth token
- reusable profile values such as display name, bio, and invalid long values

### Optional Match History Verification

The profile collection can verify the API contract for `stats` and `recentMatches`, but it does not create saved games over HTTP because there is currently no public game-results endpoint for that setup step.

If you want to manually verify non-zero stats and match history:

1. Run the profile collection through `02 Register And Login`.
2. Copy `profileOwnerId` and `profileOpponentId` from the selected Postman environment.
3. From the repository root, run:

```sh
docker compose exec server node -e "const { saveGameResult } = require('#modules/game/game.repository'); (async () => { await saveGameResult({ startedAt: new Date('2026-06-18T10:00:00.000Z'), endedAt: new Date('2026-06-18T10:18:00.000Z'), status: 'COMPLETED', players: [{ userId: OWNER_ID, score: 500, isWinner: true }, { userId: OPPONENT_ID, score: 320, isWinner: false }] }); })().catch((error) => { console.error(error); process.exit(1); });"
```

4. Replace `OWNER_ID` and `OPPONENT_ID` with the environment values from step 2.
5. Re-run `03 Public Profile Lookups / Get Public Profile By Username`.

After that request, you should see:

- `stats.gamesPlayed` updated from `0`
- `wins` / `losses` updated for the two users
- `rank` assigned
- `recentMatches` containing the saved result

## Avatar Upload

Import:

- `tests/postman/users/avatar/trackscendence-avatar-upload.postman_collection.json`
- `tests/postman/users/avatar/trackscendence-avatar-local.postman_environment.json`

Recommended usage:

1. Select the imported environment named `Trackscendence Avatar Local`.
2. Verify the avatar fixture path variables point at real local files.
3. Run `01 Initialize / Initialize Avatar Variables`.
4. Run the remaining requests top-to-bottom, or run the full collection in order.

Backend contract added for feature 33:

- `POST /api/v1/users/me/avatar`
- `DELETE /api/v1/users/me/avatar`

Upload expectations:

- authenticated request
- `multipart/form-data`
- file field name: `avatar`
- allowed types: JPEG and PNG only
- max size: 2 MB
- file signature must match the declared image type

Response contract:

- success responses return a `message` and updated `user`
- `user.avatarUrl` is the public same-origin path the frontend should render
- uploaded files are served from `/uploads/avatars/...`

Validation failures to expect:

- missing file
- unsupported MIME type
- file too large
- file contents that do not match JPEG/PNG magic bytes
- unexpected multipart field name

Fixture notes:

- The collection includes local fixtures under `tests/postman/users/avatar/fixtures/`.
- The default environment values use repo-relative paths for those files.
- The collection now resolves `{{avatar...Path}}` variables into concrete form-data file paths in a pre-request script before sending upload requests.
- If Postman still does not attach a file on your machine, re-select the file manually with the Postman file picker or use one of the smoke-check scripts below.
- If you already imported the collection before this change, re-import it or update your local copy so the new pre-request script is present.
- In both `compose:dev` and `compose:up`, the app should serve avatar paths through the frontend origin instead of exposing a backend-only asset host.

### Curl Smoke Check

If Postman still refuses to attach a local file, you can validate the backend contract without Postman:

```sh
bash tests/postman/users/avatar/avatar-upload-smoke.sh
```

If `curl` is not installed in your environment, use the Node-based version instead:

```sh
node tests/postman/users/avatar/avatar-upload-smoke.mjs
```

Optional arguments:

- first argument: custom file path
- second argument: base app URL (default: `http://localhost:8080`)

Example:

```sh
bash tests/postman/users/avatar/avatar-upload-smoke.sh \
  tests/postman/users/avatar/fixtures/avatar-valid.png \
  http://localhost:8080
```

```sh
node tests/postman/users/avatar/avatar-upload-smoke.mjs \
  tests/postman/users/avatar/fixtures/avatar-valid.png \
  http://localhost:8080
```

## Friendship Flow

Import:

- `tests/postman/friends/friendship/trackscendence-friendship.postman_collection.json`
- `tests/postman/friends/friendship/trackscendence-friendship-local.postman_environment.json`

Recommended usage:

1. Select the imported environment named `Trackscendence Friendship Local`.
2. Run `01 Initialize / Initialize Friendship Variables`.
3. Run the remaining requests top-to-bottom, or run the full collection in order.

Coverage:

- send, accept, reject, cancel, and remove friendship flows
- duplicate pending requests and reverse-request conflicts
- self-request validation
- unauthenticated and invalid-input guards

Notes:

- The collection assumes the Docker production-style stack is running on `http://localhost:8080`.
- The friendship collection auto-saves two users, their ids, and both bearer tokens.
- UI-only behavior is not covered by Postman.
