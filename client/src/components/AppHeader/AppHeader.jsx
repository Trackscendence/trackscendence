import { Link } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import getPlayerIdentity from '@/utils/getPlayerIdentity'
import Avatar from '@/components/Avatar'
import Logo from '@/components/Logo'
import SocialNavActions from '@/components/SocialNavActions'
import AccountMenu from './_components/AccountMenu'

// The shared top navigation for the signed-in surface (lobby, messages, and any
// other warm-themed page). It owns identity, so a page renders <AppHeader /> and
// gets the same clickable logo, profile, notification bell, mail, and account
// menu everywhere. Pass onCreateRoom to show the lobby's "+ Room" action.
const AppHeader = ({ onCreateRoom }) => {
  const user = useAuthStore((state) => state.user)
  if (!user) return null

  const identity = getPlayerIdentity(user)
  const accountLabel = user.isGuest ? 'Guest session' : user.email

  return (
    <header className="border-b border-black/10 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-5 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link to="/lobby" aria-label="Go to the lobby">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <SocialNavActions />
            <AccountMenu />
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {onCreateRoom ? (
            <button
              type="button"
              onClick={onCreateRoom}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-[14px] bg-[#E86D2F] px-4 text-sm font-semibold text-white transition hover:bg-[#c95b24] sm:h-auto sm:w-auto"
            >
              + Room
            </button>
          ) : null}
          <Link
            to="/profile"
            aria-label="Your profile"
            className="flex w-full min-w-0 items-center gap-3 rounded-full px-2 py-1 transition hover:bg-black/5 sm:w-auto"
          >
            <Avatar
              alt={identity.name}
              initials={identity.initials}
              size={42}
              src={identity.avatarUrl || undefined}
            />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-base text-black sm:text-lg">
                {identity.name}
              </span>
              <span className="hidden text-xs text-[#2E2D2D] sm:block">
                {accountLabel}
              </span>
            </span>
          </Link>
        </div>
      </div>
    </header>
  )
}

export default AppHeader
