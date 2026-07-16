import { useEffect, useRef, useState } from 'react'
import { LogOut, Menu, Plus, Settings, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Avatar from '@/components/Avatar'
import useAuthStore from '@/stores/useAuthStore'
import getPlayerIdentity from '@/utils/getPlayerIdentity'

// The phone-width counterpart of the AppHeader action cluster. Everything the
// desktop row spreads out (+ Room, profile chip, gear menu) collapses behind
// one hamburger so the bar stays a single line, and every entry keeps a text
// label beside its icon. Bell and mail stay outside in the bar: they carry
// unread badges and deserve one-tap access.
const MobileMenu = ({ onCreateRoom }) => {
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
    window.addEventListener('touchstart', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('touchstart', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  if (!user) return null

  const identity = getPlayerIdentity(user)
  const accountLabel = user.isGuest ? 'Guest session' : user.email

  const handleCreateRoom = () => {
    setIsOpen(false)
    onCreateRoom()
  }

  const handleLogout = async () => {
    setIsOpen(false)
    try {
      await useAuthStore.getState().logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  const itemClass =
    'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium transition hover:bg-[#fbf1e6] focus:bg-[#fbf1e6] focus:outline-none'

  return (
    <div className="relative sm:hidden" ref={menuRef}>
      <button
        aria-label="Menu"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={`flex h-9 w-9 items-center justify-center rounded-full text-[#7a3810] transition hover:bg-[#ffbf80] focus:ring-2 focus:ring-[#3d1200]/25 focus:outline-none ${
          isOpen ? 'bg-[#ffbf80]' : ''
        }`}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? (
          <X aria-hidden="true" className="h-5 w-5" strokeWidth={2.1} />
        ) : (
          <Menu aria-hidden="true" className="h-5 w-5" strokeWidth={2.1} />
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-md border border-[#e6c9a8] bg-white py-1 shadow-lg"
        >
          <Link
            role="menuitem"
            to="/profile"
            className="flex items-center gap-3 px-4 py-3 transition hover:bg-[#fbf1e6] focus:bg-[#fbf1e6] focus:outline-none"
            onClick={() => setIsOpen(false)}
          >
            <Avatar
              alt={identity.name}
              initials={identity.initials}
              size={36}
              src={identity.avatarUrl || undefined}
            />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold text-[#3d1200]">
                {identity.name}
              </span>
              <span className="truncate text-xs text-[#9a7050]">
                {accountLabel}
              </span>
            </span>
          </Link>

          <div className="border-t border-[#f5e7d4]" />

          {onCreateRoom ? (
            <button
              role="menuitem"
              type="button"
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-[#E86D2F] transition hover:bg-[#fbf1e6] focus:bg-[#fbf1e6] focus:outline-none"
              onClick={handleCreateRoom}
            >
              <Plus aria-hidden="true" className="h-5 w-5" strokeWidth={2.1} />
              New room
            </button>
          ) : null}
          <Link
            role="menuitem"
            to="/settings"
            className={`${itemClass} text-[#3d1200]`}
            onClick={() => setIsOpen(false)}
          >
            <Settings aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
            Settings
          </Link>
          <button
            role="menuitem"
            type="button"
            className={`${itemClass} text-[#b6523b]`}
            onClick={handleLogout}
          >
            <LogOut aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
            Log out
          </button>
        </div>
      )}
    </div>
  )
}

export default MobileMenu
