const { COLORS, VALUES, CARD_TYPES } = require('./game.constants')

class UnoEngine {
  constructor(playerIds = []) {
    if (!Array.isArray(playerIds) || playerIds.length < 2) {
      throw new Error('A game must have at least 2 players.')
    }
    this.players = {}
    playerIds.forEach((id) => {
      this.players[id] = [] // Array of cards
    })
    this.playerOrder = [...playerIds]
    this.drawPile = []
    this.discardPile = []
    this.currentPlayerIndex = 0
    this.playDirection = 1 // 1 for clockwise, -1 for counter-clockwise
    this.currentColor = null // Used when a Wild card is played
    this.winner = null

    this.initDeck()
    this.shuffleDeck()
    this.dealCards()
    this.startGame()
  }

  initDeck() {
    this.drawPile = []
    const standardColors = [
      COLORS.RED,
      COLORS.YELLOW,
      COLORS.GREEN,
      COLORS.BLUE,
    ]

    standardColors.forEach((color) => {
      // One 0 per color
      this.drawPile.push({ type: CARD_TYPES.NUMBER, color, value: VALUES.ZERO })

      // Two of each 1-9 per color
      const numbers = [
        VALUES.ONE,
        VALUES.TWO,
        VALUES.THREE,
        VALUES.FOUR,
        VALUES.FIVE,
        VALUES.SIX,
        VALUES.SEVEN,
        VALUES.EIGHT,
        VALUES.NINE,
      ]
      numbers.forEach((value) => {
        this.drawPile.push({ type: CARD_TYPES.NUMBER, color, value })
        this.drawPile.push({ type: CARD_TYPES.NUMBER, color, value })
      })

      // Two of each action card per color
      const actions = [VALUES.SKIP, VALUES.REVERSE, VALUES.DRAW_TWO]
      actions.forEach((value) => {
        this.drawPile.push({ type: CARD_TYPES.ACTION, color, value })
        this.drawPile.push({ type: CARD_TYPES.ACTION, color, value })
      })
    })

    // Four Wild cards and Four Wild Draw Four cards
    for (let i = 0; i < 4; i++) {
      this.drawPile.push({
        type: CARD_TYPES.WILD,
        color: COLORS.WILD,
        value: VALUES.WILD,
      })
      this.drawPile.push({
        type: CARD_TYPES.WILD,
        color: COLORS.WILD,
        value: VALUES.WILD_DRAW_FOUR,
      })
    }
  }

  shuffleDeck() {
    // Fisher-Yates shuffle
    for (let i = this.drawPile.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[this.drawPile[i], this.drawPile[j]] = [
        this.drawPile[j],
        this.drawPile[i],
      ]
    }
  }

  dealCards() {
    const CARDS_PER_PLAYER = 7
    for (let i = 0; i < CARDS_PER_PLAYER; i++) {
      this.playerOrder.forEach((playerId) => {
        this.players[playerId].push(this._drawOne())
      })
    }
  }

  startGame() {
    // Flip first card
    let firstCard = this._drawOne()
    // By official rules, if the first card is Wild Draw Four, put it back and draw another.
    while (firstCard.value === VALUES.WILD_DRAW_FOUR) {
      this.drawPile.push(firstCard)
      this.shuffleDeck()
      firstCard = this._drawOne()
    }

    this.discardPile.push(firstCard)
    this.currentColor = firstCard.color

    // If first card is Reverse, dealer plays first, but play moves counter-clockwise
    if (firstCard.value === VALUES.REVERSE) {
      this.playDirection = -1
      this.currentPlayerIndex =
        (this.playerOrder.length - 1) % this.playerOrder.length
    }
    // If first card is Skip, the first player loses their turn
    else if (firstCard.value === VALUES.SKIP) {
      this.nextTurn()
    }
    // If first card is Draw Two, first player draws 2 and loses their turn
    else if (firstCard.value === VALUES.DRAW_TWO) {
      const currentPlayerId = this.playerOrder[this.currentPlayerIndex]
      this.players[currentPlayerId].push(this._drawOne(), this._drawOne())
      this.nextTurn()
    }
    // If first card is Wild, pick a random starting color to prevent getting stuck
    if (firstCard.color === COLORS.WILD) {
      const standardColors = [COLORS.RED, COLORS.YELLOW, COLORS.GREEN, COLORS.BLUE]
      this.currentColor = standardColors[Math.floor(Math.random() * standardColors.length)]
    }
  }

  _drawOne() {
    if (this.drawPile.length === 0) {
      if (this.discardPile.length <= 1) {
        throw new Error('No more cards to draw.')
      }
      // Reshuffle discard pile into draw pile
      const topCard = this.discardPile.pop()
      this.drawPile = [...this.discardPile]
      this.discardPile = [topCard]
      this.shuffleDeck()
    }
    return this.drawPile.pop()
  }

  getTopCard() {
    return this.discardPile[this.discardPile.length - 1]
  }

  canPlayCard(card) {
    const topCard = this.getTopCard()

    if (card.color === COLORS.WILD) {
      return true
    }

    // Match by chosen color (important for wild cards)
    if (card.color === this.currentColor) {
      return true
    }

    // Match by value
    if (card.value === topCard.value) {
      return true
    }

    return false
  }

  playCard(playerId, cardIndex, declaredColor = null) {
    if (this.winner) {
      throw new Error('Game is already over')
    }

    if (this.playerOrder[this.currentPlayerIndex] !== playerId) {
      throw new Error('Not your turn')
    }

    const playerHand = this.players[playerId]
    if (cardIndex < 0 || cardIndex >= playerHand.length) {
      throw new Error('Invalid card index')
    }

    const cardToPlay = playerHand[cardIndex]

    if (!this.canPlayCard(cardToPlay)) {
      throw new Error('Illegal move: card cannot be played')
    }

    if (cardToPlay.color === COLORS.WILD) {
      if (!declaredColor) {
        throw new Error('Wild card requires a declared color')
      }
      if (![COLORS.RED, COLORS.YELLOW, COLORS.GREEN, COLORS.BLUE].includes(declaredColor)) {
        throw new Error('Invalid declared color')
      }
    }

    // Move card from hand to discard pile
    playerHand.splice(cardIndex, 1)
    this.discardPile.push(cardToPlay)

    this.currentColor =
      cardToPlay.color === COLORS.WILD ? declaredColor : cardToPlay.color

    // Check win condition
    if (playerHand.length === 0) {
      this.winner = playerId
      return
    }

    // Handle action cards
    if (cardToPlay.value === VALUES.REVERSE) {
      this.playDirection *= -1
      // If only 2 players, reverse acts like a skip
      if (this.playerOrder.length === 2) {
        this.nextTurn()
      }
    } else if (cardToPlay.value === VALUES.SKIP) {
      this.nextTurn()
    } else if (cardToPlay.value === VALUES.DRAW_TWO) {
      this.nextTurn()
      const targetId = this.playerOrder[this.currentPlayerIndex]
      this.players[targetId].push(this._drawOne(), this._drawOne())
    } else if (cardToPlay.value === VALUES.WILD_DRAW_FOUR) {
      this.nextTurn()
      const targetId = this.playerOrder[this.currentPlayerIndex]
      this.players[targetId].push(
        this._drawOne(),
        this._drawOne(),
        this._drawOne(),
        this._drawOne(),
      )
    }

    this.nextTurn()
  }

  drawCard(playerId) {
    if (this.winner) {
      throw new Error('Game is already over')
    }

    if (this.playerOrder[this.currentPlayerIndex] !== playerId) {
      throw new Error('Not your turn')
    }

    const card = this._drawOne()
    this.players[playerId].push(card)

    // Standard rules: If drawn card can be played, player could play it.
    // For simplicity of this engine, we auto-skip turn after drawing.
    // A more advanced engine would allow playing the drawn card immediately.
    this.nextTurn()

    return card
  }

  nextTurn() {
    this.currentPlayerIndex += this.playDirection

    // Wrap around
    if (this.currentPlayerIndex < 0) {
      this.currentPlayerIndex = this.playerOrder.length - 1
    } else if (this.currentPlayerIndex >= this.playerOrder.length) {
      this.currentPlayerIndex = 0
    }
  }

  getState() {
    return {
      topCard: this.getTopCard(),
      currentColor: this.currentColor,
      currentPlayer: this.playerOrder[this.currentPlayerIndex],
      playDirection: this.playDirection,
      winner: this.winner,
      deckSize: this.drawPile.length,
      playerHandsSizes: this.playerOrder.reduce((acc, id) => {
        acc[id] = this.players[id].length
        return acc
      }, {}),
    }
  }
}

module.exports = UnoEngine
