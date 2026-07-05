// Dev-only stand-in so the results screen can be shown before the backend emits
// a real match result. Places the signed-in player mid-table (rank 4) with two
// ranked players above and below, matching the live leaderboard entry shape
// `{ rank, userId, username, displayName, totalWins }`. Never used in prod
// builds — the container gates this behind `import.meta.env.DEV`.
const mockLeaderboard = (user) => [
  {
    rank: 2,
    userId: 'mock-leader-2',
    username: 'skip',
    displayName: 'Skip Lord',
    totalWins: 1780,
  },
  {
    rank: 3,
    userId: 'mock-leader-3',
    username: 'cards',
    displayName: 'Card Shark',
    totalWins: 1240,
  },
  {
    rank: 4,
    userId: user?.id ?? 'mock-current',
    username: user?.username ?? 'you',
    displayName: user?.displayName || user?.username || 'You',
    totalWins: 912,
  },
  {
    rank: 5,
    userId: 'mock-leader-5',
    username: 'flip',
    displayName: 'Flip Queen',
    totalWins: 887,
  },
  {
    rank: 6,
    userId: 'mock-leader-6',
    username: 'draw',
    displayName: 'Draw Four King',
    totalWins: 640,
  },
]

export default mockLeaderboard
