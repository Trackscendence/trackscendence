import {
  fetchAdminStats,
  fetchAdminUsers,
  fetchAdminUserDetail,
  updateAdminUserRole,
  suspendAdminUser,
  banAdminUser,
  reinstateAdminUser,
  deleteAdminUser,
} from '@/services/admin'
import useAuthStore from '@/stores/useAuthStore'
import { createSessionStore } from './createSessionStore'
import { isActiveToken } from './sessionGuard'
import {
  nextSearchToken,
  isCurrentSearchToken,
  invalidateSearchScope,
} from './searchRequestTokens'
import {
  replaceUser,
  removeUser,
  withPending,
  withoutPending,
} from './adminStore.helpers'

// Administration console domain store (#499). Owns the dashboard stats, the
// user list together with its filters (list state, not derived), the selected
// user, and per-row pending flags so one row can spin while the table stays
// live. Moderation writes are reconciled, not trusted: the row is replaced
// from the server response, and a failed action reloads the current page so
// the list can never drift from the server.

const USERS_SCOPE = 'admin:users'

const defaultState = () => ({
  stats: null,
  isLoadingStats: false,
  statsError: '',
  users: [],
  pagination: null,
  isLoadingUsers: false,
  usersError: '',
  hasLoadedUsers: false,
  query: '',
  statusFilter: '',
  roleFilter: '',
  page: 1,
  selectedUser: null,
  isLoadingUser: false,
  userError: '',
  pendingActions: {},
  actionError: '',
})

const useAdminStore = createSessionStore((set, get) => {
  // Shared write path for every moderation action: flag the row, await the
  // server, reconcile from the response. The pending flag clears on both
  // paths — that symmetry is what keeps the map from leaking rows.
  const runUserAction = async (userId, action, performRequest) => {
    const token = useAuthStore.getState().token
    set((state) => ({
      pendingActions: withPending(state.pendingActions, userId, action),
      actionError: '',
    }))
    try {
      const response = await performRequest(token)
      if (!isActiveToken(token)) return false
      const updatedUser = response?.user
      set((state) => ({
        pendingActions: withoutPending(state.pendingActions, userId),
        users:
          action === 'delete'
            ? removeUser(state.users, userId)
            : replaceUser(state.users, updatedUser),
        selectedUser:
          state.selectedUser?.id === userId
            ? action === 'delete'
              ? null
              : { ...state.selectedUser, ...updatedUser }
            : state.selectedUser,
      }))
      return true
    } catch (error) {
      if (!isActiveToken(token)) return false
      set((state) => ({
        pendingActions: withoutPending(state.pendingActions, userId),
        actionError: error?.message || 'Action failed',
      }))
      // The action may have applied server-side before the failure surfaced;
      // refetching the page is the only way to know.
      get().loadUsers()
      return false
    }
  }

  return {
    ...defaultState(),

    loadStats: async () => {
      const token = useAuthStore.getState().token
      set({ isLoadingStats: true, statsError: '' })
      try {
        const response = await fetchAdminStats(token)
        if (!isActiveToken(token)) return false
        set({ stats: response?.stats ?? null, isLoadingStats: false })
        return true
      } catch (error) {
        if (!isActiveToken(token)) return false
        set({
          isLoadingStats: false,
          statsError: error?.message || 'Could not load platform stats',
        })
        return false
      }
    },

    // Filter and page changes round-trip through here (overrides merge into
    // the stored list state), so pagination always re-queries the server
    // instead of slicing a stale payload.
    loadUsers: async (overrides = {}) => {
      const state = get()
      const filters = {
        query: overrides.query ?? state.query,
        statusFilter: overrides.statusFilter ?? state.statusFilter,
        roleFilter: overrides.roleFilter ?? state.roleFilter,
        page: overrides.page ?? state.page,
      }
      const requestToken = nextSearchToken(USERS_SCOPE)
      const token = useAuthStore.getState().token
      set({ ...filters, isLoadingUsers: true, usersError: '' })
      try {
        const response = await fetchAdminUsers(
          {
            query: filters.query,
            status: filters.statusFilter,
            role: filters.roleFilter,
            page: filters.page,
          },
          token,
        )
        if (!isCurrentSearchToken(USERS_SCOPE, requestToken)) return false
        if (!isActiveToken(token)) return false
        set({
          users: response?.users ?? [],
          pagination: response?.pagination ?? null,
          isLoadingUsers: false,
          hasLoadedUsers: true,
        })
        return true
      } catch (error) {
        if (!isCurrentSearchToken(USERS_SCOPE, requestToken)) return false
        if (!isActiveToken(token)) return false
        set({
          isLoadingUsers: false,
          hasLoadedUsers: true,
          usersError: error?.message || 'Could not load users',
        })
        return false
      }
    },

    loadUser: async (userId) => {
      const token = useAuthStore.getState().token
      set({ isLoadingUser: true, userError: '', selectedUser: null })
      try {
        const response = await fetchAdminUserDetail(userId, token)
        if (!isActiveToken(token)) return false
        set({ selectedUser: response?.user ?? null, isLoadingUser: false })
        return true
      } catch (error) {
        if (!isActiveToken(token)) return false
        set({
          isLoadingUser: false,
          userError: error?.message || 'Could not load the user',
        })
        return false
      }
    },

    changeUserRole: (userId, role) =>
      runUserAction(userId, 'role', (token) =>
        updateAdminUserRole(userId, role, token),
      ),

    suspendUser: (userId, { suspendedUntil, reason }) =>
      runUserAction(userId, 'suspend', (token) =>
        suspendAdminUser(userId, { suspendedUntil, reason }, token),
      ),

    banUser: (userId, reason) =>
      runUserAction(userId, 'ban', (token) =>
        banAdminUser(userId, reason, token),
      ),

    reinstateUser: (userId) =>
      runUserAction(userId, 'reinstate', (token) =>
        reinstateAdminUser(userId, token),
      ),

    deleteUser: (userId) =>
      runUserAction(userId, 'delete', (token) =>
        deleteAdminUser(userId, token),
      ),

    clearActionError: () => set({ actionError: '' }),

    reset: () => {
      // Invalidating the scope turns any in-flight list response into a no-op
      // so it cannot repopulate the store after logout.
      invalidateSearchScope(USERS_SCOPE)
      set(defaultState())
    },
  }
})

export default useAdminStore
