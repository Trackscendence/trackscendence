// Dev-only UNO engine behind the Rig's "Simulate game" switch. It replicates
// the server engine's rules and public-state wire shape
// (server/src/modules/game/game.engine.js), so a simulated game exercises the
// exact same client path — store -> mapServerGameState -> GameTable — that a
// live game_state_update does. If the server engine's rules change, this file
// must follow.

const STANDARD_COLORS = ['RED', 'YELLOW', 'GREEN', 'BLUE']
const NUMBER_VALUES = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
const ACTION_VALUES = ['SKIP', 'REVERSE', 'DRAW_TWO']

// The 112-card deck: standard UNO plus this game's 4 Wild Draw Three cards.
const buildDeck = () => {
  const deck = []
  STANDARD_COLORS.forEach((color) => {
    deck.push({ type: 'NUMBER', color, value: '0' })
    NUMBER_VALUES.forEach((value) => {
      deck.push({ type: 'NUMBER', color, value })
      deck.push({ type: 'NUMBER', color, value })
    })
    ACTION_VALUES.forEach((value) => {
      deck.push({ type: 'ACTION', color, value })
      deck.push({ type: 'ACTION', color, value })
    })
  })
  for (let copy = 0; copy < 4; copy += 1) {
    deck.push({ type: 'WILD', color: 'WILD', value: 'WILD' })
    deck.push({ type: 'WILD', color: 'WILD', value: 'WILD_DRAW_THREE' })
    deck.push({ type: 'WILD', color: 'WILD', value: 'WILD_DRAW_FOUR' })
  }
  return deck
}

// Fisher-Yates, in place.
const shuffle = (cards) => {
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[cards[index], cards[swapIndex]] = [cards[swapIndex], cards[index]]
  }
}

class SimEngine {
  constructor(playerIds) {
    this.hands = new Map(playerIds.map((playerId) => [playerId, []]))
    this.playerOrder = [...playerIds]
    this.drawPile = buildDeck()
    this.discardPile = []
    this.currentPlayerIndex = 0
    this.playDirection = 1
    this.currentColor = null
    this.winner = null
    this.hasDrawnThisTurn = false

    shuffle(this.drawPile)
    for (let round = 0; round < 7; round += 1) {
      this.playerOrder.forEach((playerId) => {
        this.hands.get(playerId).push(this._drawOne())
      })
    }
    this._flipFirstCard()
  }

  _flipFirstCard() {
    let firstCard = this._drawOne()
    // Official rules: a Wild Draw Four first flip goes back into the deck.
    while (firstCard.value === 'WILD_DRAW_FOUR') {
      this.drawPile.push(firstCard)
      shuffle(this.drawPile)
      firstCard = this._drawOne()
    }
    this.discardPile.push(firstCard)
    this.currentColor = firstCard.color

    if (firstCard.value === 'REVERSE') {
      this.playDirection = -1
      this.currentPlayerIndex = this.playerOrder.length - 1
    } else if (firstCard.value === 'SKIP') {
      this.nextTurn()
    } else if (firstCard.value === 'DRAW_TWO') {
      const firstPlayerId = this.playerOrder[this.currentPlayerIndex]
      this.hands.get(firstPlayerId).push(this._drawOne(), this._drawOne())
      this.nextTurn()
    } else if (firstCard.color === 'WILD') {
      this.currentColor =
        STANDARD_COLORS[Math.floor(Math.random() * STANDARD_COLORS.length)]
    }
  }

  _drawOne() {
    if (this.drawPile.length === 0) {
      if (this.discardPile.length <= 1) {
        throw new Error('No more cards to draw.')
      }
      const topCard = this.discardPile.pop()
      this.drawPile = [...this.discardPile]
      this.discardPile = [topCard]
      shuffle(this.drawPile)
    }
    return this.drawPile.pop()
  }

  getTopCard() {
    return this.discardPile[this.discardPile.length - 1]
  }

  canPlayCard(card) {
    return (
      card.color === 'WILD' ||
      card.color === this.currentColor ||
      card.value === this.getTopCard().value
    )
  }

  playCard(playerId, cardIndex, declaredColor = null) {
    const hand = this.hands.get(playerId)
    const cardToPlay = hand[cardIndex]

    hand.splice(cardIndex, 1)
    this.discardPile.push(cardToPlay)
    this.currentColor =
      cardToPlay.color === 'WILD' ? declaredColor : cardToPlay.color

    if (hand.length === 0) {
      this.winner = playerId
      return
    }

    if (cardToPlay.value === 'REVERSE') {
      this.playDirection *= -1
      // With 2 players a Reverse acts as a Skip.
      if (this.playerOrder.length === 2) this.nextTurn()
    } else if (cardToPlay.value === 'SKIP') {
      this.nextTurn()
    } else if (cardToPlay.value === 'DRAW_TWO') {
      this.nextTurn()
      const targetId = this.playerOrder[this.currentPlayerIndex]
      this.hands.get(targetId).push(this._drawOne(), this._drawOne())
    } else if (cardToPlay.value === 'WILD_DRAW_THREE') {
      this.nextTurn()
      const targetId = this.playerOrder[this.currentPlayerIndex]
      this.hands
        .get(targetId)
        .push(this._drawOne(), this._drawOne(), this._drawOne())
    } else if (cardToPlay.value === 'WILD_DRAW_FOUR') {
      this.nextTurn()
      const targetId = this.playerOrder[this.currentPlayerIndex]
      this.hands
        .get(targetId)
        .push(
          this._drawOne(),
          this._drawOne(),
          this._drawOne(),
          this._drawOne(),
        )
    }

    this.nextTurn()
  }

  // Draws one card; the turn stays with the player only when the drawn card
  // is playable (they may then play it or pass), matching the server rule.
  drawCard(playerId) {
    const card = this._drawOne()
    this.hands.get(playerId).push(card)
    this.hasDrawnThisTurn = true
    if (!this.canPlayCard(card)) this.nextTurn()
  }

  nextTurn() {
    this.hasDrawnThisTurn = false
    this.currentPlayerIndex += this.playDirection
    if (this.currentPlayerIndex < 0) {
      this.currentPlayerIndex = this.playerOrder.length - 1
    } else if (this.currentPlayerIndex >= this.playerOrder.length) {
      this.currentPlayerIndex = 0
    }
  }

  getHand(playerId) {
    return [...(this.hands.get(playerId) ?? [])]
  }

  // Same shape the server broadcasts as game_state_update (minus myHand and
  // gameId, which the caller injects per recipient).
  getState() {
    return {
      topCard: this.getTopCard(),
      currentColor: this.currentColor,
      currentPlayer: this.playerOrder[this.currentPlayerIndex],
      playDirection: this.playDirection,
      winner: this.winner,
      deckSize: this.drawPile.length,
      hasDrawnThisTurn: this.hasDrawnThisTurn,
      drawnCardThisTurn: null,
      playerHandsSizes: this.playerOrder.reduce((sizes, playerId) => {
        sizes[playerId] = this.hands.get(playerId).length
        return sizes
      }, {}),
    }
  }
}

export default SimEngine
