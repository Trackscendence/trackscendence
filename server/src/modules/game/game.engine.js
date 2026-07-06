const {
  COLORS,
  VALUES,
  CARD_TYPES,
  GAME_RULES,
  CARD_POINTS,
} = require('./game.constants')

/**
 * UnoEngine - Core game logic engine for UNO.
 * Supports standard 108 deck generation, shuffles, deal, turn-state tracking,
 * action card handling, and custom draw-and-play or draw-and-pass rules.
 */
class UnoEngine {
  /**
   * Initializes the UNO game engine with a list of player IDs.
   * Generates the deck, shuffles, deals cards, and starts the game.
   *
   * @param {string[]} playerIds - Array of unique player IDs participating in the game.
   * @throws {Error} If playerIds is invalid, has duplicate IDs, or doesn't meet player count requirements.
   */
  constructor(playerIds = []) {
    if (!Array.isArray(playerIds)) {
      throw new Error('Player IDs must be an array.')
    }
    if (
      playerIds.length < GAME_RULES.MIN_PLAYERS ||
      playerIds.length > GAME_RULES.MAX_PLAYERS
    ) {
      throw new Error(
        `A game must have between ${GAME_RULES.MIN_PLAYERS} and ${GAME_RULES.MAX_PLAYERS} players.`,
      )
    }
    const uniquePlayerIds = new Set(playerIds)
    if (uniquePlayerIds.size !== playerIds.length) {
      throw new Error('Player IDs must be unique.')
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
    this.currentColor = null // Used when a Wild card is active
    this.winner = null

    // Track state for the current turn's draw actions
    this.hasDrawnThisTurn = false
    this.drawnCardThisTurn = null

    this.initDeck()
    this.shuffleDeck()
    this.dealCards()
    this.startGame()
  }

  /**
   * Initializes the standard 108 card UNO deck.
   */
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

  /**
   * Shuffles the draw pile using the Fisher-Yates algorithm.
   */
  shuffleDeck() {
    for (let i = this.drawPile.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[this.drawPile[i], this.drawPile[j]] = [
        this.drawPile[j],
        this.drawPile[i],
      ]
    }
  }

  /**
   * Deals starting cards to all players.
   */
  dealCards() {
    for (let i = 0; i < GAME_RULES.CARDS_PER_PLAYER; i++) {
      this.playerOrder.forEach((playerId) => {
        this.players[playerId].push(this._drawOne())
      })
    }
  }

  /**
   * Begins the game by turning over the first card and handling its effects.
   */
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
      this.currentPlayerIndex = this.playerOrder.length - 1
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
    else if (firstCard.color === COLORS.WILD) {
      const standardColors = [
        COLORS.RED,
        COLORS.YELLOW,
        COLORS.GREEN,
        COLORS.BLUE,
      ]
      this.currentColor =
        standardColors[Math.floor(Math.random() * standardColors.length)]
    }
  }

  /**
   * Draws a single card from the draw pile. Reshuffles discard pile if needed.
   *
   * @private
   * @returns {Object} The drawn card.
   * @throws {Error} If there are no more cards in both draw and discard piles.
   */
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

  /**
   * Gets the card currently at the top of the discard pile.
   *
   * @returns {Object} The top card.
   */
  getTopCard() {
    return this.discardPile[this.discardPile.length - 1]
  }

  /**
   * Validates whether a card can be legally played on top of the current discard pile.
   *
   * @param {Object} card - The card to validate.
   * @returns {boolean} True if the card is playable, false otherwise.
   */
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

  /**
   * Plays a card from a player's hand. Handles win checks and action card side-effects.
   *
   * @param {string} playerId - The ID of the player making the move.
   * @param {number} cardIndex - The index of the card in the player's hand.
   * @param {string|null} declaredColor - The color choice if playing a Wild card.
   * @throws {Error} If the game is over, it's not the player's turn, index is invalid, play is illegal,
   *                 or a wild card is played without declaring a valid color.
   */
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

    // Official UNO rules: If a player drew a card this turn, they may only play THAT card.
    if (this.hasDrawnThisTurn && cardIndex !== playerHand.length - 1) {
      throw new Error('Can only play the drawn card after drawing')
    }

    const cardToPlay = playerHand[cardIndex]

    if (!this.canPlayCard(cardToPlay)) {
      throw new Error('Illegal move: card cannot be played')
    }

    if (cardToPlay.color === COLORS.WILD) {
      if (!declaredColor) {
        throw new Error('Wild card requires a declared color')
      }
      if (
        ![COLORS.RED, COLORS.YELLOW, COLORS.GREEN, COLORS.BLUE].includes(
          declaredColor,
        )
      ) {
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

  /**
   * Draws a card for the current player. If the card is playable, the turn is not advanced
   * to allow them to play it or pass. If not playable, the turn is advanced automatically.
   *
   * @param {string} playerId - The ID of the player drawing.
   * @returns {{ card: Object, playable: boolean }} The drawn card and its playability.
   * @throws {Error} If the game is over, it's not the player's turn, or they have already drawn.
   */
  drawCard(playerId) {
    if (this.winner) {
      throw new Error('Game is already over')
    }

    if (this.playerOrder[this.currentPlayerIndex] !== playerId) {
      throw new Error('Not your turn')
    }

    if (this.hasDrawnThisTurn) {
      throw new Error('Already drew a card this turn')
    }

    const card = this._drawOne()
    this.players[playerId].push(card)
    this.hasDrawnThisTurn = true
    this.drawnCardThisTurn = card

    // Standard rules: If drawn card can be played, player can choose to play it.
    // Otherwise, turn auto-skips.
    if (this.canPlayCard(card)) {
      return { card, playable: true }
    } else {
      this.nextTurn()
      return { card, playable: false }
    }
  }

  /**
   * Passes the player's turn. Only allowed if they have already drawn a card this turn.
   *
   * @param {string} playerId - The ID of the player passing.
   * @throws {Error} If the game is over, it's not the player's turn, or they haven't drawn yet.
   */
  pass(playerId) {
    if (this.winner) {
      throw new Error('Game is already over')
    }

    if (this.playerOrder[this.currentPlayerIndex] !== playerId) {
      throw new Error('Not your turn')
    }

    if (!this.hasDrawnThisTurn) {
      throw new Error('Must draw a card before passing')
    }

    this.nextTurn()
  }

  /**
   * Advances play to the next player's turn and resets turn-specific draw state.
   */
  nextTurn() {
    this.hasDrawnThisTurn = false
    this.drawnCardThisTurn = null

    this.currentPlayerIndex += this.playDirection

    // Wrap around
    if (this.currentPlayerIndex < 0) {
      this.currentPlayerIndex = this.playerOrder.length - 1
    } else if (this.currentPlayerIndex >= this.playerOrder.length) {
      this.currentPlayerIndex = 0
    }
  }

  /**
   * Point value of a single card under classic UNO scoring: number cards at
   * face value, action cards at 20, wilds at 50.
   *
   * @param {Object} card
   * @returns {number}
   */
  cardPoints(card) {
    if (card.type === CARD_TYPES.NUMBER) {
      return Number(card.value)
    }
    if (card.type === CARD_TYPES.WILD) {
      return CARD_POINTS.WILD
    }
    return CARD_POINTS.ACTION
  }

  /**
   * Final per-player scores keyed by player id. The winner collects the sum
   * of every opponent's remaining hand; everyone else scores 0. Before a
   * winner exists this is all zeros, so it is safe to include in every state
   * broadcast.
   *
   * @returns {Object<string, number>}
   */
  getScores() {
    const scores = {}
    this.playerOrder.forEach((id) => {
      scores[id] = 0
    })

    if (!this.winner) {
      return scores
    }

    scores[this.winner] = this.playerOrder
      .filter((id) => id !== this.winner)
      .reduce(
        (total, id) =>
          total +
          this.players[id].reduce(
            (handTotal, card) => handTotal + this.cardPoints(card),
            0,
          ),
        0,
      )
    return scores
  }

  /**
   * Returns the turn order of player IDs. Exposed so callers can iterate
   * players without reaching into the engine's internal `playerOrder`.
   * @returns {string[]}
   */
  getPlayerIds() {
    return [...this.playerOrder]
  }

  /**
   * Returns a copy of a single player's private hand. This is the sanctioned
   * way to read a hand; `getState()` deliberately exposes only hand sizes, so
   * callers must not read `engine.players` directly.
   * @param {string} playerId
   * @returns {Array<Object>}
   */
  getHand(playerId) {
    return [...(this.players[playerId] || [])]
  }

  /**
   * Gets the public/visible game state. Sanitizes player hands so that
   * only hand sizes (and not individual card details) are returned.
   *
   * @returns {Object} Public game state representation.
   */
  getState() {
    return {
      topCard: this.getTopCard(),
      currentColor: this.currentColor,
      currentPlayer: this.playerOrder[this.currentPlayerIndex],
      playDirection: this.playDirection,
      winner: this.winner,
      scores: this.getScores(),
      deckSize: this.drawPile.length,
      hasDrawnThisTurn: this.hasDrawnThisTurn,
      // Keep drawn card private to the acting player/caller context.
      drawnCardThisTurn: null,
      playerHandsSizes: this.playerOrder.reduce((acc, id) => {
        acc[id] = this.players[id].length
        return acc
      }, {}),
    }
  }
}

module.exports = UnoEngine
