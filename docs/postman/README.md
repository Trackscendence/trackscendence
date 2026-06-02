# Postman Auth Flow

Import these two files into Postman:

- `trackscendence-auth-security.postman_collection.json`
- `trackscendence-local.postman_environment.json`

Recommended usage:

1. Select the `Trackscendence Local` environment.
2. Run `01 Initialize / Initialize Test Variables`.
3. Run the rest of the requests top-to-bottom, or run the full collection in order.

Notes:

- The collection assumes the Docker production-style stack is running on `http://localhost:8080`.
- Mail-based reset testing uses Mailpit on `http://localhost:8025`.
- The collection auto-saves `token`, `oldToken`, `messageId`, `resetToken`, and `resetLink`.
- UI-only behavior such as redirecting on expired sessions is not covered by Postman.
