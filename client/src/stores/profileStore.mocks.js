const MOCK_PROFILE_STATS = {
  followers: 746,
  following: 324,
  gamesPlayed: 1284,
  losses: 372,
  rank: 4,
  wins: 912,
}

const MOCK_FRIENDS = [
  {
    friendSince: '2026-06-20T10:00:00.000Z',
    user: { id: 'mock-friend-1', username: 'cards', displayName: 'Card Shark' },
  },
  {
    friendSince: '2026-06-21T10:00:00.000Z',
    user: { id: 'mock-friend-2', username: 'flip', displayName: 'Flip Queen' },
  },
  {
    friendSince: '2026-06-22T10:00:00.000Z',
    user: { id: 'mock-friend-3', username: 'uno', displayName: 'Uno Master' },
  },
  {
    friendSince: '2026-06-23T10:00:00.000Z',
    user: {
      id: 'mock-friend-4',
      username: 'draw',
      displayName: 'Draw Four King',
    },
  },
  {
    friendSince: '2026-06-24T10:00:00.000Z',
    user: { id: 'mock-friend-5', username: 'skip', displayName: 'Skip Lord' },
  },
  {
    friendSince: '2026-06-25T10:00:00.000Z',
    user: {
      id: 'mock-friend-6',
      username: 'stack',
      displayName: 'Stack Champ',
    },
  },
]

const hasStats = (stats = {}) => {
  return Boolean(stats.gamesPlayed || stats.losses || stats.rank || stats.wins)
}

const shouldUseProfileMocks = () => import.meta.env.DEV

export const withMockFriends = (friends = []) => {
  if (!shouldUseProfileMocks() || friends.length > 0) return friends

  return MOCK_FRIENDS
}

export const withMockLeaderboard = ({ leaderboard = [], profile }) => {
  if (!shouldUseProfileMocks() || leaderboard.length > 0) return leaderboard

  return [
    {
      rank: 1,
      userId: 'mock-leader-1',
      username: 'uno',
      displayName: 'Uno Master',
      totalScore: 3200,
      totalWins: 2103,
    },
    {
      rank: 2,
      userId: 'mock-leader-2',
      username: 'skip',
      displayName: 'Skip Lord',
      totalScore: 2880,
      totalWins: 1780,
    },
    {
      rank: 3,
      userId: 'mock-leader-3',
      username: 'cards',
      displayName: 'Card Shark',
      totalScore: 2290,
      totalWins: 1240,
    },
    {
      rank: 4,
      userId: profile?.id || 'mock-current-profile',
      username: profile?.username || 'player',
      displayName: profile?.displayName || profile?.username || 'You',
      totalScore: 1700,
      totalWins: profile?.stats?.wins || MOCK_PROFILE_STATS.wins,
    },
    {
      rank: 5,
      userId: 'mock-leader-5',
      username: 'flip',
      displayName: 'Flip Queen',
      totalScore: 1530,
      totalWins: 887,
    },
  ]
}

export const withMockProfileStats = (profile) => {
  if (!shouldUseProfileMocks() || !profile) return profile

  const stats = profile.stats || {}
  const nextStats = hasStats(stats)
    ? {
        followers: 0,
        following: 0,
        ...stats,
      }
    : MOCK_PROFILE_STATS

  return {
    ...profile,
    friends: withMockFriends(profile.friends || []),
    stats: nextStats,
  }
}
