import ProfileLink from '@/components/ProfileLink'

// The dropdown list under the profile search. A presenter: it renders the
// users it is given as links to their public profiles and tells the container
// when one is chosen so the dropdown can close.
const PlayerSearchResults = ({ results = [], onSelect }) => {
  if (results.length === 0) {
    return (
      <p className="px-5 py-4 text-sm font-semibold text-[#7a3810]">
        No players found.
      </p>
    )
  }

  return (
    <ul className="max-h-72 divide-y divide-[#ffe7cb] overflow-y-auto">
      {results.map((user) => (
        <li key={user.id}>
          <ProfileLink
            username={user.username}
            className="flex items-baseline justify-between gap-3 px-5 py-3 hover:bg-[#fff8f2] focus:bg-[#fff8f2] focus:outline-none"
            onClick={onSelect}
          >
            <span className="font-semibold text-[#3d1200]">
              {user.displayName || user.username}
            </span>
            <span className="text-xs text-[#7a3810]">@{user.username}</span>
          </ProfileLink>
        </li>
      ))}
    </ul>
  )
}

export default PlayerSearchResults
