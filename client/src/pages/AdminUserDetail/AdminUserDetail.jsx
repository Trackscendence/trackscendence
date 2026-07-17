import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import ModerationDialogs from '@/components/ModerationDialogs'
import useAdminStore from '@/stores/useAdminStore'
import useAuthStore from '@/stores/useAuthStore'
import UserDetailHeader from './_components/UserDetailHeader'
import UserModerationPanel from './_components/UserModerationPanel'
import UserStatsRow from './_components/UserStatsRow'
import UserAuditLog from './_components/UserAuditLog'

// Admin user detail (#504): everything the console knows about one account —
// identity, moderation state and verbs, stats, and the audit trail. Container
// only; a successful delete navigates back to the table (the record is gone).
const AdminUserDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useAdminStore((state) => state.selectedUser)
  const isLoadingUser = useAdminStore((state) => state.isLoadingUser)
  const userError = useAdminStore((state) => state.userError)
  const pendingActions = useAdminStore((state) => state.pendingActions)
  const currentUserId = useAuthStore((state) => state.user?.id)
  const [pendingIntent, setPendingIntent] = useState(null)

  useEffect(() => {
    const loadUser = async () => {
      try {
        await useAdminStore.getState().loadUser(id)
      } catch {
        // The store owns detail error state.
      }
    }
    loadUser()
  }, [id])

  if (isLoadingUser) return <LoadingSpinner message="Loading account" />

  if (userError) {
    return (
      <p
        role="alert"
        className="bg-status-banned/10 text-status-banned rounded-2xl px-4 py-3 text-sm font-semibold"
      >
        {userError}
      </p>
    )
  }

  if (!user) return null

  return (
    <section aria-label={`Account ${user.username}`} className="space-y-5">
      <UserDetailHeader user={user} />
      <UserStatsRow user={user} />
      <UserModerationPanel
        user={user}
        isSelf={user.id === currentUserId}
        isPending={Boolean(pendingActions[user.id])}
        onAction={(type) => setPendingIntent({ type, user })}
      />
      <UserAuditLog entries={user.auditLog ?? []} />
      <ModerationDialogs
        action={pendingIntent}
        onClose={() => setPendingIntent(null)}
        onActionComplete={(type, succeeded) => {
          if (type === 'delete' && succeeded) navigate('/admin/players')
        }}
      />
    </section>
  )
}

export default AdminUserDetail
