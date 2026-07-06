# Realtime game contract

The socket layer carries the whole game once matchmaking hands off from the
lobby. This is the wire shape: which events flow, in which direction, and what
each payload holds. The authoritative payload builder for `game_state_update`
lives in `server/src/modules/game/game.contract.js`, and the privacy guarantee
below is regression-tested in `game.contract.test.js`.

Socket.IO is mounted at `path: '/websocket/'`. The client authenticates in the
handshake with `auth: { token: <JWT> }`; the server puts the authenticated user
on `socket.user` and joins a private `user:<id>` room, which is how per-player
state reaches exactly one recipient.

## Server to client

### `game_start`

Sent to each matched player when their room fills and a game begins.

```
{ gameId: string, players: [{ userId: number, username: string }, ...] }
```

The client keeps `players` for the whole game to caption opponents; the
in-game state updates below carry only ids and hand sizes.

### `game_state_update`

The core event: the full public state of the game plus the recipient's own
hand. Emitted to each player individually so no one receives another player's
cards.

```
{
  topCard:        { color, value, type },   // top of the discard pile
  currentColor:   'RED' | 'YELLOW' | 'GREEN' | 'BLUE',
  currentPlayer:  number,                    // whose turn it is
  playDirection:  1 | -1,                    // clockwise | counter-clockwise
  winner:         number | null,
  scores:         { [userId]: number },      // all zeros until a winner is set
  deckSize:       number,                     // cards left in the draw pile
  hasDrawnThisTurn: boolean,
  drawnCardThisTurn: null,                    // kept private, never populated here
  playerHandsSizes: { [userId]: number },     // every player's hand *count*
  myHand:         [{ color, value, type }, ...], // ONLY the recipient's cards
  gameId:         string,
}
```

**Privacy guarantee:** the payload contains the recipient's `myHand` and, for
everyone else, only a count in `playerHandsSizes`. No other player's cards
appear anywhere in the payload. `engine.getState()` deliberately exposes hand
sizes rather than hands, and never the engine's internal `players` map.

### `game_drawn_card`

Sent only to the player who drew, right after a `game:draw_card`, so the client
can highlight the drawn card and whether it is playable. The authoritative hand
still arrives in the following `game_state_update`.

```
{ gameId: string, card: { color, value, type }, playable: boolean }
```

### `game_over`

Sent to the whole game room when a game ends, after the result is persisted.

```
{ gameId: string, winnerUserId: number | null, reason: 'completed' | 'player_left', abandonedBy?: number }
```

`completed` carries the winning `winnerUserId`; `player_left` (abandoned)
carries `winnerUserId: null` and the `abandonedBy` user id.

### `game_error`

Sent to the acting player when a move is rejected (not your turn, illegal card,
game not found, missing declared color). The client surfaces `message` as a
toast; the next `game_state_update` reconciles the table.

```
{ message: string }
```

## Client to server

All three carry the `gameId` and act on the caller's own seat; the server
verifies the turn and legality, so the client never mutates state locally.

### `game:play_card`

```
{ gameId: string, cardIndex: number, declaredColor?: 'RED'|'YELLOW'|'GREEN'|'BLUE' }
```

`declaredColor` is required only when the played card is a wild.

### `game:draw_card`

```
{ gameId: string }
```

Draws one card. If it is playable the turn is held (play it or pass); otherwise
the turn advances automatically.

### `game:pass_turn`

```
{ gameId: string }
```

Only legal after drawing a card this turn.

### `game:state`

```
{ gameId: string }
```

Resync request (page refresh, reconnect). The server replays `game_start`
followed by a `game_state_update` for the caller, and re-joins their socket to
the game room. Rejected with `game_error` if the caller is not in that game.

## Deviations from physical UNO

These are intentional and also recorded in `docs/game-rules.md`:

- No "UNO!" call-out penalty and no Wild Draw Four challenge.
- If the first flipped card is a Wild, the engine picks a random starting color
  rather than letting the first player choose.
