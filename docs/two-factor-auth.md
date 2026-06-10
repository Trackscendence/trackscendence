# Two-Factor Authentication

This document describes the TOTP-based 2FA module added for the user-management minor feature.

## Overview

The project now supports:

- TOTP-based two-factor authentication
- QR-code setup data for authenticator apps
- recovery codes as a backup second factor
- protected enable, regenerate, and disable flows
- login that requires a second factor when 2FA is enabled

The frontend exposes this flow through the authenticated `Settings` page.

## User Flow

### Enable 2FA

1. Log in with email/username and password.
2. Open `Settings`.
3. Start 2FA setup.
4. Scan the QR code or manually enter the secret into an authenticator app.
5. Save the recovery codes.
6. Enter a valid authenticator code to confirm setup.

After confirmation, 2FA becomes active for future logins.

### Log In With 2FA Enabled

1. Enter email/username and password on the login page.
2. If 2FA is enabled, the backend returns a temporary login challenge instead of a full session.
3. Complete login with either:
   - a valid authenticator code
   - a valid recovery code

Recovery codes are only a backup second factor. They do not replace password reset.

### Regenerate 2FA

Authenticated users can start a fresh 2FA setup from `Settings`.

- the old active 2FA remains valid until the new setup is confirmed
- new recovery codes are issued for the pending setup
- once the new setup is confirmed, the new secret and recovery codes replace the old ones

### Disable 2FA

Authenticated users can disable 2FA from `Settings`.

Disabling 2FA removes:

- the active TOTP secret
- any pending TOTP setup
- all stored recovery codes

## Security Model

### TOTP Secrets

- TOTP secrets are not stored in plaintext
- they are encrypted server-side before being written to the database
- pending setup secrets and active secrets are tracked separately

### Recovery Codes

- recovery codes are generated once per setup/regeneration
- only hashed recovery codes are stored in the database
- each recovery code can be used exactly once
- after use, the code is consumed and cannot authenticate again

### Login Challenges

- password verification happens first
- if 2FA is enabled, the server returns a short-lived challenge token
- the final JWT access token is only issued after successful second-factor verification

### Password Reset vs Recovery Codes

Recovery codes are not an alternative to `forgot password`.

- if a user forgets their password, they must use the password reset flow
- if a user knows their password but cannot access their authenticator app, they can use a recovery code

## Backend Endpoints

Current 2FA endpoints:

- `POST /api/v1/auth/login/2fa`
- `POST /api/v1/auth/two-factor/setup`
- `POST /api/v1/auth/two-factor/confirm`
- `POST /api/v1/auth/two-factor/disable`
- `POST /api/v1/auth/two-factor/regenerate`

The standard login endpoint:

- `POST /api/v1/auth/login`

returns a challenge response instead of a session token when 2FA is enabled.

## Frontend Surface

The main user-facing entry points are:

- `Login` page for password step + second-factor step
- `Settings` page for enabling, confirming, regenerating, and disabling 2FA

The login UI also explains that recovery codes can be used if the user has lost access to the authenticator app after entering the correct password.

## Local Demo

### Run the stack

Use the Docker production-style setup:

```bash
npm run compose:up
```

Open:

- app: `http://localhost:8080`
- Mailpit: `http://localhost:8025`

### Manual UI demo

1. Create an account.
2. Log in.
3. Open `Settings`.
4. Start 2FA setup.
5. Scan the QR code in an authenticator app.
6. Save the recovery codes.
7. Confirm setup with the current TOTP code.
8. Log out.
9. Log back in and verify that a second factor is required.
10. Repeat login once with a TOTP code and once with a recovery code.

### API demo with Postman

The Postman collection in [docs/postman/README.md](/home/ogrativ/Projects/trackscendence/docs/postman/README.md) now includes:

- TOTP setup
- TOTP confirmation
- 2FA login challenge
- recovery-code login
- single-use recovery-code validation
- disable/regenerate flows

The collection generates TOTP codes inside Postman from the setup secret, so the 2FA API flow can be demonstrated without manually copying codes from an authenticator app.
