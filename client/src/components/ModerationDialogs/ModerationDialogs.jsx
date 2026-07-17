import ConfirmDialog from '@/components/ConfirmDialog'
import useAdminStore from '@/stores/useAdminStore'
import useNotificationStore from '@/stores/useNotificationStore'
import SuspendDialog from '@/components/SuspendDialog'
import BanDialog from '@/components/BanDialog'

// One dialog host for every moderation action (#503/#504), shared by the
// Players table and the user detail view. The page hands it the pending
// intent ({ type, user }); this container dispatches the store action, then
// surfaces the outcome as a toast. The store already reconciles the row from
// the server response (or reloads the page on failure), so nothing here
// touches the list. onActionComplete lets a page react to the outcome — the
// detail view leaves after a successful delete.
const ModerationDialogs = ({ action, onClose, onActionComplete }) => {
  const pendingActions = useAdminStore((state) => state.pendingActions)

  if (!action) return null

  const { type, user } = action
  const isConfirming = Boolean(pendingActions[user.id])
  const notify = (message, tone) =>
    useNotificationStore.getState().push(message, tone)

  const run = async (perform, successMessage) => {
    const succeeded = await perform()
    if (succeeded) {
      notify(successMessage, 'success')
    } else {
      notify(
        useAdminStore.getState().actionError || 'The action failed',
        'error',
      )
    }
    onClose()
    onActionComplete?.(type, succeeded)
  }

  const store = useAdminStore.getState()

  if (type === 'suspend') {
    return (
      <SuspendDialog
        user={user}
        isConfirming={isConfirming}
        onCancel={onClose}
        onConfirm={(payload) =>
          run(
            () => store.suspendUser(user.id, payload),
            `@${user.username} suspended`,
          )
        }
      />
    )
  }

  if (type === 'ban') {
    return (
      <BanDialog
        user={user}
        isConfirming={isConfirming}
        onCancel={onClose}
        onConfirm={(reason) =>
          run(() => store.banUser(user.id, reason), `@${user.username} banned`)
        }
      />
    )
  }

  if (type === 'role') {
    const nextRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN'
    const verb = nextRole === 'ADMIN' ? 'Make admin' : 'Make player'
    return (
      <ConfirmDialog
        isOpen
        tone="primary"
        title={`${verb}: @${user.username}`}
        description={
          nextRole === 'ADMIN'
            ? 'They gain the full console: moderation, role changes, and deletion.'
            : 'They lose console access immediately. The last admin cannot be demoted.'
        }
        confirmLabel={verb}
        confirmingLabel="Updating…"
        isConfirming={isConfirming}
        onCancel={onClose}
        onConfirm={() =>
          run(
            () => store.changeUserRole(user.id, nextRole),
            `@${user.username} is now ${nextRole === 'ADMIN' ? 'an admin' : 'a player'}`,
          )
        }
      />
    )
  }

  if (type === 'reinstate') {
    return (
      <ConfirmDialog
        isOpen
        tone="primary"
        title={`Reinstate @${user.username}`}
        description="Their account returns to active and they can sign in again."
        confirmLabel="Reinstate"
        confirmingLabel="Reinstating…"
        isConfirming={isConfirming}
        onCancel={onClose}
        onConfirm={() =>
          run(
            () => store.reinstateUser(user.id),
            `@${user.username} reinstated`,
          )
        }
      />
    )
  }

  return (
    <ConfirmDialog
      isOpen
      title={`Delete @${user.username}`}
      description="Removes the account from the platform. This is recorded in the audit log and cannot be undone from the console."
      confirmLabel="Delete account"
      confirmingLabel="Deleting…"
      isConfirming={isConfirming}
      onCancel={onClose}
      onConfirm={() =>
        run(() => store.deleteUser(user.id), `@${user.username} deleted`)
      }
    />
  )
}

export default ModerationDialogs
