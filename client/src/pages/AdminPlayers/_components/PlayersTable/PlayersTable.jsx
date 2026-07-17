import DataTable from '@/components/DataTable'
import Pagination from '@/components/Pagination'
import StatusBadge from '@/components/StatusBadge'
import PlayerIdentity from '../PlayerIdentity'
import PlayersRowCard from '../PlayersRowCard'
import PlayersRowMenu from '../PlayersRowMenu'
import { formatJoinedDate } from '../../_utils/playersFormatters'

const buildColumns = ({ currentUserId, pendingActions, onAction }) => [
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
  {
    key: 'actions',
    header: <span className="sr-only">Actions</span>,
    className: 'w-12 text-right',
    render: (user) => (
      <PlayersRowMenu
        user={user}
        isSelf={user.id === currentUserId}
        isPending={Boolean(pendingActions[user.id])}
        onAction={onAction}
      />
    ),
  },
]

// The Players table (#502/#503): the shared DataTable shell with our columns,
// stacked cards below `sm`, server-driven paging, and the per-row action
// menu. Presenter: list state, paging, and the confirm flows live upstream.
const PlayersTable = ({
  users,
  pagination,
  isLoading,
  error,
  currentUserId,
  pendingActions,
  onPageChange,
  onAction,
}) => (
  <div className="space-y-4">
    <DataTable
      columns={buildColumns({ currentUserId, pendingActions, onAction })}
      rows={users}
      rowKey={(user) => user.id}
      renderCard={(user) => (
        <PlayersRowCard
          user={user}
          isSelf={user.id === currentUserId}
          isPending={Boolean(pendingActions[user.id])}
          onAction={onAction}
        />
      )}
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
