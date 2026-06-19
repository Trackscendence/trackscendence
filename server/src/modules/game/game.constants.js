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
}

module.exports = {
  COLORS,
  VALUES,
  CARD_TYPES,
  GAME_RULES,
}
