import PlayerSearch from '@/components/PlayerSearch'

// Section heading plus the player quick search (#502). The search reuses the
// shared PlayerSearch dropdown (scope-isolated); picking a result is handed
// up so the page can filter the table to that player.
const PlayersHeader = ({ onPickUser }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1
        id="admin-players-heading"
        className="text-2xl font-black tracking-tight sm:text-3xl"
      >
        Players
      </h1>
      <p className="text-admin-muted mt-1 text-sm font-medium">
        Search, review, and moderate accounts
      </p>
    </div>
    <PlayerSearch
      className="sm:max-w-xs"
      inputId="admin-player-search"
      placeholder="Search players..."
      scope="admin-players"
      showIcon
      onSelectUser={onPickUser}
    />
  </div>
)

export default PlayersHeader
