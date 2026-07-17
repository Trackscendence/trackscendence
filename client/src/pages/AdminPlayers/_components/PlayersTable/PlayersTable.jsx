import DataTable from '@/components/DataTable'
import Pagination from '@/components/Pagination'
import StatusBadge from '@/components/StatusBadge'
import PlayerIdentity from '../PlayerIdentity'
import PlayersRowCard from '../PlayersRowCard'
import { formatJoinedDate } from '../../_utils/playersFormatters'

const COLUMNS = [
  {
    key: 'player',
    header: 'Player',
    render: (user) => <PlayerIdentity user={user} />,
  },
  {
    key: 'status',
    header: 'Status',
    render: (user) => <StatusBadge status={user.status} />,
  },
  {
    key: 'gamesPlayed',
    header: 'Games',
    className: 'tabular-nums',
    render: (user) => user.gamesPlayed ?? 0,
  },
  {
    key: 'wins',
    header: 'Wins',
    className: 'tabular-nums',
    render: (user) => user.wins ?? 0,
  },
  {
    key: 'createdAt',
    header: 'Joined',
    render: (user) => formatJoinedDate(user.createdAt),
  },
]

// The Players table (#502): the shared DataTable shell with our columns,
// stacked cards below `sm`, and server-driven paging via the shared
// Pagination. Pure presenter — list state and paging round-trips live in the
// page container.
const PlayersTable = ({
  users,
  pagination,
  isLoading,
  error,
  onPageChange,
}) => (
  <div className="space-y-4">
    <DataTable
      columns={COLUMNS}
      rows={users}
      rowKey={(user) => user.id}
      renderCard={(user) => <PlayersRowCard user={user} />}
      isLoading={isLoading}
      error={error}
      emptyMessage="No players match these filters."
    />
    <Pagination
      pagination={pagination}
      onPageChange={onPageChange}
      disabled={isLoading}
    />
  </div>
)

export default PlayersTable
