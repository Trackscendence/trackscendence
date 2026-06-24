# Postman Auth And 2FA Flow

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
- The collection now covers register/login, TOTP 2FA setup, recovery-code login, disable/regenerate 2FA, password change, and forgot/reset-password flows.
- TOTP codes are generated inside Postman from the setup secret, so you can demo the full 2FA API flow without manually opening an authenticator app.
- The collection auto-saves `token`, `oldToken`, `challengeToken`, `twoFactorSecret`, `recoveryCode`, `messageId`, `resetToken`, and `resetLink`.
- Run the collection in order if you want the full end-to-end scenario: it enables 2FA, verifies login with a second factor, disables 2FA again, and then continues into the password-reset checks.
- UI-only behavior such as redirecting on expired sessions is not covered by Postman.
