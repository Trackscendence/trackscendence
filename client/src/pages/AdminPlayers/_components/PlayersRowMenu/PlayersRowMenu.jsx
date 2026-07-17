import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MoreHorizontal } from 'lucide-react'

// Which moderation verbs a row offers, by its current state. The admin's own
// row gets none of them (the backend refuses self-moderation; the menu just
// doesn't offer it), only the profile link.
const actionsForUser = (user) => {
  const actions = [
    user.role === 'ADMIN'
      ? { type: 'role', label: 'Make player' }
      : { type: 'role', label: 'Make admin' },
  ]
  if (user.status === 'ACTIVE') {
    actions.push({ type: 'suspend', label: 'Suspend' })
    actions.push({ type: 'ban', label: 'Ban', danger: true })
  }
  if (user.status === 'SUSPENDED') {
    actions.push({ type: 'reinstate', label: 'Reinstate' })
    actions.push({ type: 'ban', label: 'Ban', danger: true })
  }
  if (user.status === 'BANNED') {
    actions.push({ type: 'reinstate', label: 'Reinstate' })
  }
  actions.push({ type: 'delete', label: 'Delete account', danger: true })
  return actions
}

// The per-row action menu (#503). Local state is UI-only (open/closed); every
// pick is reported upward as (type, user) and the page owns the confirm flow.
const PlayersRowMenu = ({ user, isSelf, isPending, onAction }) => {
  const menuRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) return undefined
    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('touchstart', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('touchstart', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handlePick = (type) => {
    setIsOpen(false)
    onAction(type, user)
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-label={`Actions for ${user.username}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        disabled={isPending}
        className={`text-admin-ink/70 hover:bg-admin-ink/5 hover:text-admin-ink flex h-11 w-11 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:w-9 ${
          isOpen ? 'bg-admin-ink/5' : ''
        }`}
        onClick={() => setIsOpen((open) => !open)}
      >
        <MoreHorizontal aria-hidden="true" className="h-5 w-5" />
      </button>
      {isOpen && (
        <div
          role="menu"
          className="border-admin-ink/10 absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border bg-white py-1 shadow-lg"
        >
          <Link
            role="menuitem"
            to={`/admin/users/${user.id}`}
            className="text-admin-ink hover:bg-admin-bg/60 block px-4 py-2.5 text-sm font-semibold"
            onClick={() => setIsOpen(false)}
          >
            View account
          </Link>
          {!isSelf &&
            actionsForUser(user).map((action) => (
              <button
                key={`${action.type}-${action.label}`}
                role="menuitem"
                type="button"
                className={`hover:bg-admin-bg/60 block w-full px-4 py-2.5 text-left text-sm font-semibold ${
                  action.danger ? 'text-status-banned' : 'text-admin-ink'
                }`}
                onClick={() => handlePick(action.type)}
              >
                {action.label}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}

export default PlayersRowMenu
