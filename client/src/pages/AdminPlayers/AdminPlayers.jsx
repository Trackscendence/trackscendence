import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAdminStore from '@/stores/useAdminStore'
import useAuthStore from '@/stores/useAuthStore'
import ModerationDialogs from '@/components/ModerationDialogs'
import PlayersHeader from './_components/PlayersHeader'
import PlayersFilters from './_components/PlayersFilters'
import PlayersTable from './_components/PlayersTable'

// Players section of the Administration console (#502/#503). Container only:
// it reads the admin store, loads the first page on mount, round-trips every
// filter and page change through loadUsers (the server does the filtering),
// and holds the one piece of local UI state — which row action awaits
// confirmation. Picking a quick-search result jumps straight to that
// account's console record (#504).
const AdminPlayers = () => {
  const navigate = useNavigate()
  const users = useAdminStore((state) => state.users)
  const pagination = useAdminStore((state) => state.pagination)
  const isLoadingUsers = useAdminStore((state) => state.isLoadingUsers)
  const usersError = useAdminStore((state) => state.usersError)
  const hasLoadedUsers = useAdminStore((state) => state.hasLoadedUsers)
  const statusFilter = useAdminStore((state) => state.statusFilter)
  const roleFilter = useAdminStore((state) => state.roleFilter)
  const pendingActions = useAdminStore((state) => state.pendingActions)
  const currentUserId = useAuthStore((state) => state.user?.id)
  // The row action awaiting confirmation: { type, user } or null.
  const [pendingIntent, setPendingIntent] = useState(null)

  useEffect(() => {
    const loadFirstPage = async () => {
      try {
        await useAdminStore.getState().loadUsers({ page: 1 })
      } catch {
        // The store owns list error state.
      }
    }
    loadFirstPage()
  }, [])

  const { loadUsers } = useAdminStore.getState()

  return (
    <section aria-labelledby="admin-players-heading" className="space-y-5">
      <PlayersHeader
        onPickUser={(user) => navigate(`/admin/users/${user.id}`)}
      />
      <PlayersFilters
        statusFilter={statusFilter}
        roleFilter={roleFilter}
        onStatusChange={(value) => loadUsers({ statusFilter: value, page: 1 })}
        onRoleChange={(value) => loadUsers({ roleFilter: value, page: 1 })}
      />
      <PlayersTable
        users={users}
        pagination={pagination}
        isLoading={isLoadingUsers && !hasLoadedUsers}
        error={usersError}
        currentUserId={currentUserId}
        pendingActions={pendingActions}
        onPageChange={(page) => loadUsers({ page })}
        onAction={(type, user) => setPendingIntent({ type, user })}
      />
      <ModerationDialogs
        action={pendingIntent}
        onClose={() => setPendingIntent(null)}
      />
    </section>
  )
}

export default AdminPlayers
