import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import { isAdmin } from '@/utils/authorization'

// The gear menu next to the lobby avatar (#219): Settings links to the account
// settings page, Log out clears the session, and admins get the console entry
// (#520) since this menu is where account-scoped destinations live. A small
// container: it owns its open state and reaches the logout action directly
// rather than prop-drilling it down through the lobby nav.
const AccountMenu = () => {
  const navigate = useNavigate()
  const menuRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const user = useAuthStore((state) => state.user)

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
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleLogout = async () => {
    setIsOpen(false)
    try {
      await useAuthStore.getState().logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex h-9 w-9 items-center justify-center rounded-full text-[#7a3810] transition hover:bg-[#ffbf80] focus:ring-2 focus:ring-[#3d1200]/25 focus:outline-none"
        type="button"
        onClick={() => setIsOpen((open) => !open)}
      >
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-md border border-[#e6c9a8] bg-white py-1 shadow-lg"
        >
          {/* Only admins see the console entry; the route stays gated by
              RoleRoute regardless (#520). */}
          {isAdmin(user) ? (
            <Link
              role="menuitem"
              to="/admin"
              className="block px-4 py-2 text-sm font-medium text-[#3d1200] transition hover:bg-[#fbf1e6] focus:bg-[#fbf1e6] focus:outline-none"
              onClick={() => setIsOpen(false)}
            >
              Admin console
            </Link>
          ) : null}
          <Link
            role="menuitem"
            to="/settings"
            className="block px-4 py-2 text-sm font-medium text-[#3d1200] transition hover:bg-[#fbf1e6] focus:bg-[#fbf1e6] focus:outline-none"
            onClick={() => setIsOpen(false)}
          >
            Settings
          </Link>
          <button
            role="menuitem"
            type="button"
            className="block w-full px-4 py-2 text-left text-sm font-medium text-[#b6523b] transition hover:bg-[#fbf1e6] focus:bg-[#fbf1e6] focus:outline-none"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  )
}

export default AccountMenu
