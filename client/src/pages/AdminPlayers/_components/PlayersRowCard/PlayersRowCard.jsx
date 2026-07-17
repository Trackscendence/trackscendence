import StatusBadge from '@/components/StatusBadge'
import PlayerIdentity from '../PlayerIdentity'
import { formatJoinedDate } from '../../_utils/playersFormatters'

// One player as a stacked card, the below-`sm` form of the table row (spec
// §6b: cards, never a sideways-scrolling table). The row actions join in
// #503.
const PlayersRowCard = ({ user }) => (
  <div className="space-y-3">
    <div className="flex items-start justify-between gap-2">
      <PlayerIdentity user={user} />
      <StatusBadge status={user.status} />
    </div>
    <dl className="text-admin-muted flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium">
      <div className="flex gap-1">
        <dt>Games</dt>
        <dd className="text-admin-ink font-bold tabular-nums">
          {user.gamesPlayed ?? 0}
        </dd>
      </div>
      <div className="flex gap-1">
        <dt>Wins</dt>
        <dd className="text-admin-ink font-bold tabular-nums">
          {user.wins ?? 0}
        </dd>
      </div>
      <div className="flex gap-1">
        <dt>Joined</dt>
        <dd className="text-admin-ink font-bold">
          {formatJoinedDate(user.createdAt)}
        </dd>
      </div>
    </dl>
  </div>
)

export default PlayersRowCard
