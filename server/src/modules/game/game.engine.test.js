const UnoEngine = require('./game.engine')
const { COLORS } = require('./game.constants')

console.log('=== Testing UNO Engine ===')

try {
  // 1. Initialize Game
  const playerIds = ['p1', 'p2', 'p3', 'p4']
  const game = new UnoEngine(playerIds)
  console.log('Game initialized with 4 players.')
  console.log('Initial state:', game.getState())

  // 2. Validate Deck Generation
  let totalCards = game.drawPile.length + game.discardPile.length
  Object.values(game.players).forEach((hand) => {
    totalCards += hand.length
  })
  console.log(`Total cards generated: ${totalCards} (Expected: 108)`)
  if (totalCards !== 108)
    throw new Error('Deck generation failed: not 108 cards.')

  // 3. Test drawing a card
  const initialCurrentPlayer = game.getState().currentPlayer
  console.log(`Player ${initialCurrentPlayer} is drawing a card...`)
  const drawnCard = game.drawCard(initialCurrentPlayer)
  console.log(`Drawn card:`, drawnCard)

  // 4. Test playing a card (find a valid one)
  const nextPlayer = game.getState().currentPlayer
  console.log(
    `Now it's player ${nextPlayer}'s turn. Current top card:`,
    game.getTopCard(),
    `Color:`,
    game.currentColor,
  )

  const hand = game.players[nextPlayer]
  const validCardIndex = hand.findIndex((card) => game.canPlayCard(card))

  if (validCardIndex !== -1) {
    const cardToPlay = hand[validCardIndex]
    console.log(`Player ${nextPlayer} plays`, cardToPlay)
    const declaredColor = cardToPlay.color === COLORS.WILD ? COLORS.RED : null
    game.playCard(nextPlayer, validCardIndex, declaredColor)
    console.log(
      'Turn successful. Next player is:',
      game.getState().currentPlayer,
    )
  } else {
    console.log(`Player ${nextPlayer} has no valid cards, drawing...`)
    game.drawCard(nextPlayer)
    console.log(
      'Turn successful (drew card). Next player is:',
      game.getState().currentPlayer,
    )
  }

  console.log('=== All Tests Passed ===')
} catch (e) {
  console.error('Test failed:', e)
  process.exit(1)
}
