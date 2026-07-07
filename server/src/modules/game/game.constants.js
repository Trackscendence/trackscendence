const COLORS = {
  RED: 'RED',
  YELLOW: 'YELLOW',
  GREEN: 'GREEN',
  BLUE: 'BLUE',
  WILD: 'WILD',
}

const VALUES = {
  ZERO: '0',
  ONE: '1',
  TWO: '2',
  THREE: '3',
  FOUR: '4',
  FIVE: '5',
  SIX: '6',
  SEVEN: '7',
  EIGHT: '8',
  NINE: '9',
  SKIP: 'SKIP',
  REVERSE: 'REVERSE',
  DRAW_TWO: 'DRAW_TWO',
  WILD: 'WILD',
  WILD_DRAW_THREE: 'WILD_DRAW_THREE',
  WILD_DRAW_FOUR: 'WILD_DRAW_FOUR',
}

const CARD_TYPES = {
  NUMBER: 'NUMBER',
  ACTION: 'ACTION',
  WILD: 'WILD',
}

const GAME_RULES = {
  CARDS_PER_PLAYER: 7,
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 10,
  // Cards drawn when a player is caught not calling UNO on their last card.
  UNO_PENALTY_CARDS: 2,
}

// Classic UNO end-of-round scoring: number cards score their face value,
// action cards (Skip, Reverse, Draw Two) score 20, and wilds (Wild, Wild
// Draw Four) score 50. The winner collects the sum of everyone else's hand.
const CARD_POINTS = {
  ACTION: 20,
  WILD: 50,
}

module.exports = {
  COLORS,
  VALUES,
  CARD_TYPES,
  GAME_RULES,
  CARD_POINTS,
}
