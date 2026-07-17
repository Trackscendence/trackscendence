import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Gamepad2, Podium, ShieldCheck, Trophy } from 'lucide-react'
import useAuthStore from '@/stores/useAuthStore'
import getPlayerIdentity from '@/utils/getPlayerIdentity'
import { isAdmin } from '@/utils/authorization'
import Avatar from '@/components/Avatar'
import Logo from '@/components/Logo'
import NavIconLink from '@/components/NavIconLink'
import QuickStartModal from '@/components/QuickStartModal'
import SocialNavActions from '@/components/SocialNavActions'
import AccountMenu from './_components/AccountMenu'
import MobileMenu from './_components/MobileMenu'

// The shared top navigation for the signed-in surface (lobby, messages, and any
// other warm-themed page). It is private to Layout, which renders it above the
// page content so every signed-in page gets the same clickable logo, profile,
// notification bell, mail, and account menu. Creating a room is a global
// action, so the header owns "+ Room" too: picking a size hands the seat to the
// waiting room as navigation intent (the same flow the lobby always used),
// which means creating from any page lands the player in their new room.
//
// Desktop keeps everything in one row. Below sm the shortcuts, "+ Room",
// profile chip, and gear collapse behind MobileMenu (#443/#445); only the
// badge-carrying bell and mail icons stay in the bar.
const Header = () => {
  const navigate = useNavigate()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const user = useAuthStore((state) => state.user)
  if (!user) return null

  const identity = getPlayerIdentity(user)
  const accountLabel = user.isGuest ? 'Guest session' : user.email

  const handlePickRoomSize = (capacity) => {
    setIsCreateModalOpen(false)
    navigate('/', { state: { seatIntent: { type: 'create', capacity } } })
  }

  return (
    <header className="flex items-center justify-between border-b border-black/10 bg-white px-4 py-3 sm:px-8">
      <Link to="/lobby" aria-label="Go to the lobby">
        <Logo />
      </Link>
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden items-center gap-2 sm:flex">
          <NavIconLink to="/lobby" label="Lobby" icon={Gamepad2} />
          <NavIconLink to="/tournament" label="Tournaments" icon={Trophy} />
          <NavIconLink to="/leaderboard" label="Leaderboard" icon={Podium} />
          {/* Operator entry (#497): only admins see the console link; the
              route itself stays gated by RoleRoute either way. */}
          {isAdmin(user) ? (
            <NavIconLink to="/admin" label="Admin" icon={ShieldCheck} />
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="hidden items-center gap-2 rounded-[14px] bg-[#E86D2F] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#c95b24] sm:flex"
        >
          + Room
        </button>
        <Link
          to="/profile"
          aria-label="Your profile"
          className="hidden items-center gap-3 rounded-full pr-2 transition hover:bg-black/5 sm:flex"
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
        <div className="hidden sm:block">
          <AccountMenu />
        </div>
        <MobileMenu onCreateRoom={() => setIsCreateModalOpen(true)} />
      </div>
      <QuickStartModal
        isOpen={isCreateModalOpen}
        title="Create Room"
        description="Choose how many players this room holds. You will wait there until the seats fill."
        onPick={handlePickRoomSize}
        onCancel={() => setIsCreateModalOpen(false)}
      />
    </header>
  )
}

export default Header
