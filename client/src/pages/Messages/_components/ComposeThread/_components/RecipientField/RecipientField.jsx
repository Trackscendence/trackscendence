import { X } from 'lucide-react'
import Avatar from '@/components/Avatar'
import PlayerSearch from '@/components/PlayerSearch'
import getPlayerIdentity from '@/utils/getPlayerIdentity'

// The To: row of the compose panel. Before a recipient is picked it hosts the
// shared PlayerSearch (results drop upward: this row sits just above the
// composer); after, it shows the picked player as a removable chip.
const RecipientField = ({ onClear, onPick, recipient }) => (
  <div className="flex flex-col gap-3 border-t border-[#f0d9bd] bg-white px-4 py-3 sm:flex-row sm:items-center sm:px-5">
    <span className="text-sm font-black text-[#3d1200]">To:</span>
    {recipient ? (
      <RecipientChip recipient={recipient} onClear={onClear} />
    ) : (
      <PlayerSearch
        autoFocus
        showIcon
        placeholder="Search Players"
        resultsPlacement="above"
        scope="compose-recipient"
        onSelectUser={onPick}
      />
    )}
  </div>
)

const RecipientChip = ({ onClear, recipient }) => {
  const identity = getPlayerIdentity(recipient)

  return (
    <span className="flex w-full min-w-0 items-center gap-2 rounded-full bg-[#fff0df] py-1 pr-2 pl-1 sm:w-auto">
      <Avatar
        alt={identity.name}
        initials={identity.initials}
        size={24}
        src={identity.avatarUrl}
      />
      <span className="min-w-0 truncate text-sm font-black text-[#3d1200]">
        {identity.name}
      </span>
      <button
        aria-label="Remove recipient"
        type="button"
        className="flex h-5 w-5 items-center justify-center rounded-full text-[#7a3810] transition hover:bg-white focus:ring-2 focus:ring-[#3d1200]/20 focus:outline-none"
        onClick={onClear}
      >
        <X aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.4} />
      </button>
    </span>
  )
}

export default RecipientField
