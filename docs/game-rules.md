# UNO rules, mapped to the engine

This is the reference for anyone touching game logic, and the onboarding doc
for teammates who have never played UNO. Every rule points at where the engine
(`server/src/modules/game/game.engine.js`) implements it, and the deliberate
deviations from physical UNO are called out at the end. The realtime wire shape
that carries these rules to the client is documented separately in
[game-realtime-contract.md](./game-realtime-contract.md).

## The deck

A 112-card deck: the standard 108 UNO cards plus this game's four custom Wild
Draw Three cards. For each of the four colors (red, yellow, green, blue) one
`0`, two each of `1`–`9`, and two each of Skip, Reverse, and Draw Two; plus
four Wild, four Wild Draw Three, and four Wild Draw Four cards. Built in
`initDeck()` and shuffled with Fisher-Yates in `shuffleDeck()`.

Each card is `{ type, color, value }` where `type` is `NUMBER`, `ACTION`, or
`WILD`. Wild cards carry `color: 'WILD'` until played, when the player declares
a real color.

## Setup and the first card

Every player is dealt 7 cards (`dealCards()`), then the top card of the draw
pile is flipped to start the discard pile (`startGame()`). The first card's
effect applies immediately:

- **Number** — normal play begins with the first player.
- **Reverse** — direction flips; the dealer effectively plays first.
- **Skip** — the first player loses their turn.
- **Draw Two** — the first player draws two and is skipped.
- **Wild** — the engine picks a random starting color (a deviation, see below).
- **Wild Draw Three** — treated as a Wild opener: the engine picks a random
  starting color and no one draws. It is not returned to the deck.
- **Wild Draw Four** — never allowed as the starting card: it is returned to
  the deck and another is flipped.

## Taking a turn

On your turn you play a card that matches the top of the discard pile by
**color**, by **value/symbol**, or any **wild** (`canPlayCard()`). A wild lets
you declare the next color (`playCard()` takes a `declaredColor`).

If you cannot play, or choose not to, you draw exactly one card
(`drawCard()`). If that drawn card is playable you may play it immediately;
otherwise your turn passes automatically. After drawing you may only play the
card you drew, not another card from your hand — the engine enforces this in
`playCard()`. If you drew a playable card but do not want to play it, you
`pass()` (only allowed once you have drawn this turn).

Turn order and direction are tracked by `nextTurn()`.

## Action cards

Handled in `playCard()`:

- **Skip** — the next player loses their turn.
- **Reverse** — play direction flips. With only two players it acts as a Skip.
- **Draw Two** — the next player draws two cards and is skipped.
- **Wild** — the player declares the active color; no draw.
- **Wild Draw Three** — the next player draws three cards, is skipped, and the
  player declares the active color. A custom card, see the deviations below.
- **Wild Draw Four** — the next player draws four cards, is skipped, and the
  player declares the active color.

## Running out of cards

When the draw pile empties, the discard pile is reshuffled back into it, keeping
the current top card in place (`_drawOne()`).

## Winning and scoring

The first player to empty their hand wins; `playCard()` sets `winner`. The
winner then scores the sum of every opponent's remaining hand: number cards at
face value, action cards (Skip, Reverse, Draw Two) at 20, and wilds (Wild, Wild
Draw Three, Wild Draw Four) at 50. Everyone else scores 0. Computed by
`getScores()` (with
per-card values from `cardPoints()`), persisted to `GamePlayer.score`.

## Rule-to-engine map

| Rule                                                         | Engine                        | Status      |
| ------------------------------------------------------------ | ----------------------------- | ----------- |
| 112-card deck composition (108 + 4 Wild Draw Three)          | `initDeck()`                  | done        |
| Deal 7, flip first card, apply its effect                    | `dealCards()`, `startGame()`  | done        |
| Play matches by color, value, or wild; wilds declare a color | `canPlayCard()`, `playCard()` | done        |
| Can't/won't play → draw one; play it if playable, else pass  | `drawCard()`, `pass()`        | done        |
| After drawing, only the drawn card may be played             | `playCard()`                  | done        |
| Skip / Reverse (Skip with 2 players) / Draw Two              | `playCard()` action handling  | done        |
| Wild Draw Three (+3, skip, declare color) — custom card      | `playCard()`                  | done        |
| Wild Draw Four (+4, skip, declare color)                     | `playCard()`                  | done        |
| Draw pile empty → reshuffle discard, keep top card           | `_drawOne()`                  | done        |
| Win = first empty hand                                       | `playCard()` sets `winner`    | done        |
| Scoring: winner takes opponents' hand points                 | `getScores()`, `cardPoints()` | done (#197) |

The engine test file (`game.engine.test.js`) covers each implemented row,
including a full scoring pass.

## Deliberate deviations

These differ from physical UNO on purpose:

- **Custom Wild Draw Three card.** Standard UNO has no +3 card. This game adds
  four Wild Draw Three cards that play like a lighter Wild Draw Four: the next
  player draws three, is skipped, and the player declares the color. It has its
  own art and corner label (`+3`).
- **No "UNO!" call-out penalty.** A player at one card is not required to
  announce it, and there is no two-card penalty for being caught.
- **No Wild Draw Four challenge.** The card is always accepted; the next player
  cannot challenge whether it was played legally.
- **Random color on a Wild first card.** If the very first flipped card is a
  Wild, the engine picks a random starting color rather than letting the first
  player choose, so the game can never open in a stuck state.

## Card art

Both wild-draw cards have their own centre art and corner labels: Wild Draw
Four renders the `+4` primitive and Wild Draw Three the `+3` primitive
(`client/src/components/Card/_components/Symbol`). The server value maps to the
card `type` in `mapServerGameState` (`WILD_DRAW_FOUR` → `wild_draw4`,
`WILD_DRAW_THREE` → `wild_draw3`).
