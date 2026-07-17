import { useEffect } from 'react'
import useAdminStore from '@/stores/useAdminStore'
import PlayersHeader from './_components/PlayersHeader'
import PlayersFilters from './_components/PlayersFilters'
import PlayersTable from './_components/PlayersTable'

// Players section of the Administration console (#502). Container only: it
// reads the admin store, loads the first page on mount, and round-trips
// every filter, quick-search pick, and page change back through loadUsers so
// the server always does the filtering.
const AdminPlayers = () => {
  const users = useAdminStore((state) => state.users)
  const pagination = useAdminStore((state) => state.pagination)
  const isLoadingUsers = useAdminStore((state) => state.isLoadingUsers)
  const usersError = useAdminStore((state) => state.usersError)
  const hasLoadedUsers = useAdminStore((state) => state.hasLoadedUsers)
  const query = useAdminStore((state) => state.query)
  const statusFilter = useAdminStore((state) => state.statusFilter)
  const roleFilter = useAdminStore((state) => state.roleFilter)

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
        onPickUser={(user) => loadUsers({ query: user.username, page: 1 })}
      />
      <PlayersFilters
        statusFilter={statusFilter}
        roleFilter={roleFilter}
        query={query}
        onStatusChange={(value) => loadUsers({ statusFilter: value, page: 1 })}
        onRoleChange={(value) => loadUsers({ roleFilter: value, page: 1 })}
        onClearQuery={() => loadUsers({ query: '', page: 1 })}
      />
      <PlayersTable
        users={users}
        pagination={pagination}
        isLoading={isLoadingUsers && !hasLoadedUsers}
        error={usersError}
        onPageChange={(page) => loadUsers({ page })}
      />
    </section>
  )
}

export default AdminPlayers
