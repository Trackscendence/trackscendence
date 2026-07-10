# Friendship ERM

This note explains the database shape for feature `#28` and why `Friendship` is modeled as its own entity instead of a simple implicit many-to-many relation.

## ERM

```mermaid
erDiagram
    User ||--o{ Friendship : requester
    User ||--o{ Friendship : addressee
    User ||--o{ Friendship : blocker

    User {
        int id PK
        string email
        string username
        datetime createdAt
        datetime updatedAt
    }

    Friendship {
        int id PK
        int requesterId FK
        int addresseeId FK
        enum status
        int blockedById FK nullable
        datetime createdAt
        datetime updatedAt
    }
```

## Why This Is Not A Simple Many-To-Many Table

An implicit many-to-many relation is not enough here, because the friendship flow is not just "user A is connected to user B".

We also need to store:

- who initiated the request
- who received the request
- the current lifecycle state: `PENDING`, `ACCEPTED`, or `BLOCKED`
- who performed the block, when applicable
- timestamps for request creation and later transitions

Because the relationship has its own state and behavior, `Friendship` is an associative entity with business meaning, not a temporary helper table.

## Field Meanings

- `requesterId`: the user who initiated the friend request
- `addresseeId`: the user who received the friend request
- `status = PENDING`: request exists and is waiting for response
- `status = ACCEPTED`: users are friends
- `status = BLOCKED`: the relationship exists in a blocked state
- `blockedById`: which side performed the block

## Cardinality

- One `User` can initiate many friendship rows.
- One `User` can receive many friendship rows.
- One `User` can block many friendship rows.
- One `Friendship` row always belongs to exactly two users:
  - one requester
  - one addressee

## Integrity Rules

At the database level, the schema/migrations enforce these invariants:

- a user cannot create a friendship with themselves
- only `PENDING`, `ACCEPTED`, and `BLOCKED` are allowed
- `blockedById` must be null unless the status is `BLOCKED`
- if `blockedById` is present, it must match either the requester or addressee
- the same unordered pair of users can exist only once

## Naming Note

On the `User` model, the Prisma relation fields are named:

- `outgoingFriendships`
- `incomingFriendships`
- `friendshipsBlockedByUser`

These names are meant to describe the role of the user in the relationship row more clearly than "sent/received friendships".

## UI State Mapping

How the lifecycle above surfaces in the interface (#395). The profile's primary
action is derived in `ProfileSurface/_utils/profileActions`, and messaging is
gated on `ACCEPTED` end to end: the mailbox button calls
`useDirectMessageStore.ensureConversation`, and the server rejects direct
messages between non-friends.

| Relationship state (viewer's perspective) | Profile shows                                                    | Notification panel        |
| ----------------------------------------- | ---------------------------------------------------------------- | ------------------------- |
| No row, or no `PENDING`/`ACCEPTED` status | "Add a friend" button (UserPlus icon), opens the request modal   | —                         |
| `PENDING`, viewer is the requester        | Disabled "Request sent"                                          | —                         |
| `PENDING`, viewer is the addressee        | Disabled "Request received"                                      | Accept and Reject buttons |
| `ACCEPTED`                                | Friends pair: Handshake badge plus Mailbox button (opens the DM) | —                         |
| `BLOCKED`                                 | Disabled "Unavailable"                                           | —                         |

Accept keeps the request's intro message as the first direct message and can
navigate straight into the new conversation. Reject deletes the `PENDING` row
(`respondToFriendRequest` with `action: 'reject'`), so the pair can request
again later.
