import ProfileLink from '@/components/ProfileLink'

// The dropdown list under the player search. A presenter: without onPick it
// renders the users it is given as links to their public profiles; with
// onPick each row is a button that hands the user back to the container
// (the compose panel picks a recipient this way). Either way it reports the
// choice through onSelect so the dropdown can close.
const rowClassName =
  'flex w-full items-baseline justify-between gap-3 px-5 py-3 text-left hover:bg-[#fff8f2] focus:bg-[#fff8f2] focus:outline-none'

const PlayerSearchResults = ({ results = [], onPick = null, onSelect }) => {
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
          {onPick ? (
            <button
              type="button"
              className={rowClassName}
              onClick={() => onPick(user)}
            >
              <span className="font-semibold text-[#3d1200]">
                {user.displayName || user.username}
              </span>
              <span className="text-xs text-[#7a3810]">@{user.username}</span>
            </button>
          ) : (
            <ProfileLink
              username={user.username}
              className={rowClassName}
              onClick={onSelect}
            >
              <span className="font-semibold text-[#3d1200]">
                {user.displayName || user.username}
              </span>
              <span className="text-xs text-[#7a3810]">@{user.username}</span>
            </ProfileLink>
          )}
        </li>
      ))}
    </ul>
  )
}

export default PlayerSearchResults
