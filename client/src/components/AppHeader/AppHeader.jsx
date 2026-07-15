import { Link } from 'react-router-dom'
import { Podium, Trophy } from 'lucide-react'
import useAuthStore from '@/stores/useAuthStore'
import getPlayerIdentity from '@/utils/getPlayerIdentity'
import Avatar from '@/components/Avatar'
import Logo from '@/components/Logo'
import NavIconLink from '@/components/NavIconLink'
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
    <header className="flex items-center justify-between border-b border-black/10 bg-white px-8 py-3">
      <Link to="/lobby" aria-label="Go to the lobby">
        <Logo />
      </Link>
      <div className="flex items-center gap-4">
        {/* Kept as one group with "+ Room" so a future narrow-screen collapse
            treats the shortcuts together (#443/#445). */}
        <div className="flex items-center gap-2">
          <NavIconLink to="/tournament" label="Tournaments" icon={Trophy} />
          <NavIconLink to="/leaderboard" label="Leaderboard" icon={Podium} />
        </div>
        {onCreateRoom ? (
          <button
            type="button"
            onClick={onCreateRoom}
            className="flex items-center gap-2 rounded-[14px] bg-[#E86D2F] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#c95b24]"
          >
            + Room
          </button>
        ) : null}
        <Link
          to="/profile"
          aria-label="Your profile"
          className="flex items-center gap-3 rounded-full pr-2 transition hover:bg-black/5"
        >
          <Avatar
            alt={identity.name}
            initials={identity.initials}
            size={46}
            src={identity.avatarUrl || undefined}
          />
          <span className="flex flex-col">
            <span className="text-lg text-black">{identity.name}</span>
            <span className="text-xs text-[#2E2D2D]">{accountLabel}</span>
          </span>
        </Link>
        <SocialNavActions />
        <AccountMenu />
      </div>
    </header>
  )
}

export default AppHeader
