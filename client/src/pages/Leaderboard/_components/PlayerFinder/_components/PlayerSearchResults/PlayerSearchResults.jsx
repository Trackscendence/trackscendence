import { Link } from 'react-router-dom'

// Result list for the player finder. A presenter: renders the users it is
// given as links to their public profiles.
const PlayerSearchResults = ({ results = [] }) => {
  if (results.length === 0) {
    return (
      <p className="bg-white px-5 py-4 text-sm font-semibold text-[#7a3810]">
        No players found.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-[#ffe7cb] bg-white">
      {results.map((user) => (
        <li key={user.id}>
          <Link
            to={`/users/${user.username}`}
            className="flex items-baseline justify-between gap-3 px-5 py-3 hover:bg-[#fff8f2]"
          >
            <span className="font-semibold text-[#3d1200]">
              {user.displayName || user.username}
            </span>
            <span className="text-xs text-[#7a3810]">@{user.username}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default PlayerSearchResults
