# Lobby room creation race notes

## Summary

This bug looked like a server concurrency problem, but most of it came from
client state arriving in the wrong order.

The user flow was:

1. Open `/lobby`.
2. Click `+ Room`.
3. The app skipped the room-size picker and created a default 2-player room.
4. End the room and return to `/lobby`.
5. Click `+ Room` again.
6. A new room was opened, but the UI stayed on `/lobby` and rendered the room
   card in the lobby body.

The server logs made the sequence look suspicious:

```text
User szhong opened room 589
User szhong left the lobby
User szhong left the lobby
User szhong opened room 590
```

Those logs were useful, but they were not the whole bug.

## What happened

Three separate issues crossed each other.

First, the lobby `+ Room` button did not open a room-size picker. It navigated
straight to the waiting room with a create intent that had no capacity. The
waiting room then emitted `room:create` without a capacity, and the server used
its default capacity of 2.

Second, the client stored `roomClosed` as a boolean. When the owner ended room
589, the server emitted `room:closed` with the room id. The client collapsed
that payload into `true`. If that event arrived after the owner had already
navigated back to the lobby, the next waiting-room mount could see stale
`roomClosed=true`, create room 590, and immediately navigate back to `/lobby`.
That explains "I created a room but saw it rendered in the lobby."

Third, the local room-list suppression was too broad and too short-lived. When
the player ended a room, the client briefly hid "my room" while waiting for the
authoritative `rooms_update`. The next create cleared that suppression. If an
older `rooms_update` still contained room 589, the lobby could render a stale
room card after the next create flow had started.

## Why the duplicate "left the lobby" log appeared

The waiting room schedules a deferred cleanup on unmount. That cleanup emits
`room:leave` and `leave_lobby`. The explicit leave or end action also navigates
back to `/lobby`. React mount/unmount timing and the deferred cleanup can make
`leave_lobby` happen more than once around the same user gesture.

That duplicated log is noisy, but it does not explain the visible stale room
card by itself. The more important bug was that the client did not track which
room had closed.

## The fix

The fix was to make room identity part of the client state transitions.

The lobby now opens the size picker every time the user clicks `+ Room`. After
the user picks a size, the app navigates to the waiting room with a create
intent that includes the selected capacity.

The socket handler now stores the closed room id from `room:closed`, instead of
storing only `true`.

The waiting room compares the closed room id against the current room id or the
room id it is trying to join. A close event for room 589 no longer redirects a
fresh create flow for room 590.

The room store also remembers ended room ids in a small bounded list. That keeps
a late room-list update from showing room 589 after the owner has ended it,
even if a new create flow has already cleared the old "hide my current room"
flag.

## How to reason about this bug class

This kind of bug usually comes from treating an event as a boolean when the
event belongs to a specific object.

For this flow, these are the useful questions:

- Which room is this event about?
- Which room is the UI currently showing?
- Is the user creating a new room, joining an existing room, or leaving one?
- Can an older socket event arrive after a newer navigation?
- If a stale event arrives, does the client have enough identity to ignore it?

If the answer to the last question is "no", the state is probably too vague.
Use an id, a version, a timestamp, or a request token instead of a boolean.

## Regression checks

The tests now cover these cases:

- a close event for the current room navigates back to the lobby
- a close event for an old room is cleared during a fresh create intent
- a close event for the room being joined still navigates, even before the room
  list hydrates
- an ended room id stays hidden if a late `rooms_update` includes it after a
  new create flow starts
- a normal leave still allows the room to reappear when the player is no longer
  seated in it

These tests are small, but they pin down the behavior that matters: stale events
must not control the next room flow.

## Work tree Docker note

The Docker failure during testing was a separate setup issue. A git work tree
gets a different Compose project name, so its containers and volumes are
separate. Host ports are not separate. If another stack is already publishing
`5173`, `3001`, `5432`, `8081`, or `8025`, a second stack using the copied
`.env` will fail with "port is already allocated".

There are two safe ways to handle that while debugging:

1. Stop the other stack before starting this checkout's stack.
2. Use different host ports in the checkout's local `.env` for the services
   that expose ports.

Do not add a temporary Compose override file to the repo for this. If you need
one locally, keep it untracked or use inline Compose options from the shell.
