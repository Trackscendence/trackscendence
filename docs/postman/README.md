# Postman Collections

This folder contains documentation for local Trackscendence Postman checks.

The actual Postman collections and environments now live in `tests/postman/`.

Recommended taxonomy for future additions:

- `tests/postman/<domain>/<feature>/`

Suggested structure:

- `tests/postman/auth/security/`
- `tests/postman/users/profile/`

Each collection keeps reusable test variables in a matching environment file, so the collection JSON stays generic and easy to rerun.

## Auth Security

Import:

- [tests/postman/auth/security/trackscendence-auth-security.postman_collection.json](/home/ogrativ/Projects/trackscendence/tests/postman/auth/security/trackscendence-auth-security.postman_collection.json:1)
- [tests/postman/auth/security/trackscendence-auth-local.postman_environment.json](/home/ogrativ/Projects/trackscendence/tests/postman/auth/security/trackscendence-auth-local.postman_environment.json:1)

Recommended usage:

1. Select the imported environment named `Trackscendence Auth Local`.
2. Run `01 Initialize / Initialize Test Variables`.
3. Run the rest of the requests top-to-bottom, or run the full collection in order.

Coverage:

- register, login, and `/auth/me`
- password change flow
- forgot/reset password flow with Mailpit
- single-use reset token check
- weak-password and validation guards

Notes:

- The collection assumes the Docker production-style stack is running on `http://localhost:8080`.
- Mail-based reset testing uses Mailpit on `http://localhost:8025`.
- The collection auto-saves `token`, `oldToken`, `messageId`, `resetToken`, and `resetLink`.
- UI-only behavior such as redirecting on expired sessions is not covered by Postman.

## Profile And Stats

Import:

- [tests/postman/users/profile/trackscendence-profile-stats.postman_collection.json](/home/ogrativ/Projects/trackscendence/tests/postman/users/profile/trackscendence-profile-stats.postman_collection.json:1)
- [tests/postman/users/profile/trackscendence-profile-local.postman_environment.json](/home/ogrativ/Projects/trackscendence/tests/postman/users/profile/trackscendence-profile-local.postman_environment.json:1)

Recommended usage:

1. Select the imported environment named `Trackscendence Profile Local`.
2. Run `01 Initialize / Initialize Profile Variables`.
3. Run the rest of the requests top-to-bottom, or run the full collection in order.

Coverage:

- public profile lookup via `GET /api/v1/users/:username`
- protected self-update via `PATCH /api/v1/users/me`
- zero-state lifetime stats contract for new users
- public/private field exposure checks
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
