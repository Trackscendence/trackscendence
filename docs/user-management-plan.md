# User management module plan

Issue: #56

Related shipped issues:

- #27, customizable profiles and statistics
- #28, friendship relationships
- #33, avatar upload and profile settings
- #60, account data export and account deletion
- #101, guest login and guest account upgrade

## Goal

The standard user-management module connects authentication, public identity,
settings, avatars, friends, and presence. The goal is to keep identity rules in
one place so the subject requirements can be demonstrated without duplicating
logic across pages and stores.

## Current module map

| Concern                          | Current owner                                                      | Status  |
| -------------------------------- | ------------------------------------------------------------------ | ------- |
| Registration and login           | `server/src/modules/auth`, `client/src/stores/useAuthStore.js`     | Done    |
| Guest session and upgrade        | `auth.service.js`, `SettingsPage` account section                  | Done    |
| Public and private profiles      | `server/src/modules/users`, `Profile`, `User`, `ProfileSurface`    | Done    |
| Profile editing                  | `PATCH /api/v1/users/me`, `AccountSettings`, `useProfileStore`     | Done    |
| Avatar upload and removal        | `POST /api/v1/users/me/avatar`, `DELETE /api/v1/users/me/avatar`   | Done    |
| Friend requests and friend lists | `server/src/modules/friends`, `profileStore.helpers.js`            | Done    |
| Online presence for friends      | Socket connection state exists, friend presence broadcast does not | Planned |
| Data export and deletion         | `users.data-rights.*`, settings privacy and danger sections        | Done    |

## Identity decisions

User identity has one durable row in `User`. Password auth, 42 OAuth, and guest
upgrade all attach to that row and share the same profile shape. Guest upgrade
keeps the existing `id`, so games, friends, and profile URLs do not move when a
guest saves the account.

`username` is the route-safe identity and stays stable after creation. The
profile display name is optional and editable. Display fallback is
`displayName || username`.

The auth response is the session source for `email`, `username`, `displayName`,
`bio`, `avatarUrl`, `isGuest`, role, stats, and security flags. Profile writes
return both the refreshed profile and the refreshed auth user so the navbar,
settings preview, and profile surface stay in sync without a page reload.

Bot users are normal `User` rows for games and leaderboard stats, but they are
not sign-in identities. Password login and reset token creation reject bot rows.

## Profile update plan

Keep profile edits narrow:

- `PATCH /api/v1/users/me` updates `displayName` and `bio`.
- Empty strings clear the field to `null`.
- `displayName` is capped at 40 characters.
- `bio` is capped at 280 characters.
- Email and username changes are outside this module. Guest upgrade is the only
  current path that changes a guest's login identity.

The client entry point is Settings -> Account. The page delegates writes through
`useProfileStore`, which uses one `isSubmitting` gate for profile and avatar
writes.

## Avatar plan

Uploaded avatars use the existing local upload pipeline:

- field name: `avatar`
- accepted types: JPEG and PNG
- max size: 2 MB
- server validation checks both MIME type and file signature
- public URL shape: `/uploads/avatars/<filename>`
- removal deletes the previous file when the URL maps to local avatar storage

The default avatar comes from the shared `Avatar` component when `avatarUrl` is
missing. It renders initials from display name or username, so no default image
file is needed.

## Friends and presence plan

Friendship state lives in the explicit `Friendship` model with `PENDING`,
`ACCEPTED`, and `BLOCKED`. The current API covers request, accept, reject,
cancel, remove, list friends, and list pending requests. Public profile loads
return the relationship between the viewer and the profile owner.

Online presence is the remaining implementation slice:

1. Server keeps a process-local `Map<userId, socketCount>` in the socket layer.
2. On connect, increment the count and notify accepted friends when the count
   moves from 0 to 1.
3. On disconnect, decrement the count and notify accepted friends when it drops
   to 0.
4. Presence events go only to `user:<friendId>` rooms, using accepted
   friendships from the repository.
5. The client stores `onlineUserIds` in the profile or chat store and passes an
   `online` prop to the shared `Avatar`.
6. Multiple tabs count as one online user because the server tracks socket
   counts.

This can land as a small follow-up without changing the profile or friendship
database model.

## Demonstration checklist

1. Register or log in as a normal user.
2. Open Settings -> Account, update display name and bio, refresh, and confirm
   the public profile shows the same values.
3. Upload a JPEG or PNG avatar under 2 MB, then remove it. Confirm the fallback
   initials return.
4. Create or log in as a second user, search for the first user, send a friend
   request, accept it, and confirm both profiles show the relationship.
5. Use the data export from Settings -> Privacy and confirm profile, avatar URL,
   friendships, rooms, and games are represented.
6. Delete a test account from Settings -> Danger Zone and confirm personal
   fields are anonymized while historical game rows remain.
7. Once presence lands, open the two accounts in separate browsers and confirm
   the accepted friend appears online, then offline after the last socket closes.

## Follow-up boundaries

#30 owns dynamic chat rooms and room administration. It should reuse friendship
and identity data, but profile, avatar, and auth rules stay in the user
management modules.

#178 is a final pre-submission history step and does not change user-management
behavior.
