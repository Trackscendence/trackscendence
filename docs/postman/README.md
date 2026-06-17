# Postman Flows

Available collections:

- `trackscendence-auth-security.postman_collection.json`
- `trackscendence-friendship.postman_collection.json`

Shared environment:

- `trackscendence-local.postman_environment.json`

Import the environment plus whichever collection you want to run.

Recommended usage:

1. Select the `Trackscendence Local` environment.
2. For the auth collection, run `01 Initialize / Initialize Test Variables`.
3. For the friendship collection, run `01 Initialize / Initialize Friendship Variables`.
4. Run the remaining requests top-to-bottom, or run the full collection in order.

Notes:

- The collection assumes the Docker production-style stack is running on `http://localhost:8080`.
- Mail-based reset testing uses Mailpit on `http://localhost:8025`.
- The collection auto-saves `token`, `oldToken`, `messageId`, `resetToken`, and `resetLink`.
- The friendship collection auto-saves two users, their ids, and both bearer tokens.
- The friendship collection now covers happy paths plus duplicate pending requests, reverse-request conflicts, self-request validation, and unauthenticated access guards.
- UI-only behavior such as redirecting on expired sessions is not covered by Postman.
