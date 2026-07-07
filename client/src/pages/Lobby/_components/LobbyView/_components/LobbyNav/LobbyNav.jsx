import { Link } from 'react-router-dom'
import Avatar from '@/components/Avatar'
import Logo from '@/components/Logo'
import AccountMenu from './_components/AccountMenu'

const LobbyNav = ({ user, onCreateRoom }) => {
  return (
    <header className="flex items-center justify-between border-b border-black/10 bg-white px-8 py-3">
      <Logo />
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onCreateRoom}
          className="flex items-center gap-2 rounded-[14px] bg-[#E86D2F] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#c95b24]"
        >
          + Room
        </button>
        <Link
          to="/users/me"
          aria-label="Your profile"
          className="flex items-center gap-3 rounded-full pr-2 transition hover:bg-black/5"
        >
          <Avatar
            alt={user.displayName}
            initials={user.initials}
            size={46}
            src={user.avatarUrl || undefined}
          />
          <span className="flex flex-col">
            <span className="text-lg text-black">{user.displayName}</span>
            <span className="text-xs text-[#2E2D2D]">{user.email}</span>
          </span>
        </Link>
        <AccountMenu />
      </div>
    </header>
  )
}

export default LobbyNav
