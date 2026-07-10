import { Link } from 'react-router-dom'
import { Handshake, Mailbox, Settings, UserPlus } from 'lucide-react'
import Button from '@/components/Button'
import ProfileAvatar from '../ProfileAvatar'
import ProfileStatStrip from '../ProfileStatStrip'
import ProfileTabs from '../ProfileTabs'
import profileActions from '../../_utils/profileActions'
import profileFormatters from '../../_utils/profileFormatters'

// The icon carries the relationship stage before the label is read: UserPlus
// means you can connect, the handshake means you are friends, the mailbox
// opens the conversation, and waiting states stay plain.
const actionIcons = {
  request: UserPlus,
}

const ProfileHeader = ({
  activeTab,
  isOwnProfile,
  isSubmitting,
  onPrimaryAction,
  onTabChange,
  profile,
  relationship,
}) => {
  const stats = profile.stats || {}
  const action = profileActions.getProfileActionState({ relationship })
  const ActionIcon = actionIcons[action.kind]
  const metadata = isOwnProfile ? profile.email : `@${profile.username}`

  return (
    <header>
      <div className="relative min-h-[260px] bg-[#ffd099] px-4 pt-6 pb-18 text-[#3d1200] sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center lg:gap-10">
            <ProfileAvatar profile={profile} />
            <div className="min-w-0">
              <div className="flex items-start gap-2">
                <h1 className="text-2xl font-semibold break-words text-[#3d1200] sm:text-[28px]">
                  {profileFormatters.getDisplayName(profile)}
                </h1>
              </div>
              <p className="mt-1 text-sm break-all text-[#7a3810]">
                {metadata}
              </p>
              <ProfileStatStrip stats={stats} />
            </div>
          </div>

          {isOwnProfile ? (
            <Link
              aria-label="Open settings"
              to="/settings"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#7a3810] transition hover:bg-[#ffbf80] focus:ring-2 focus:ring-[#3d1200]/25 focus:outline-none"
            >
              <Settings aria-hidden="true" className="h-5 w-5" />
            </Link>
          ) : action.kind === 'friends' ? (
            // The friends pair: the handshake states the relationship, the
            // mailbox opens the conversation. Both stay button-sized (h-9).
            <div className="flex shrink-0 items-center gap-2">
              <span
                aria-label="You are friends"
                role="img"
                title="Friends"
                className="flex h-9 w-9 items-center justify-center border border-[#e86d2f] text-[#e86d2f]"
              >
                <Handshake aria-hidden="true" className="h-5 w-5" />
              </span>
              <Button
                aria-label={`Message ${profileFormatters.getDisplayName(profile)}`}
                title="Message"
                className="flex h-9 w-9 items-center justify-center rounded-none !px-0 !py-0"
                disabled={isSubmitting}
                fullWidth={false}
                type="button"
                variant="orange"
                onClick={() => onPrimaryAction({ kind: 'message' })}
              >
                <Mailbox aria-hidden="true" className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Button
              className="flex h-9 w-full items-center justify-center gap-2 rounded-none sm:w-[138px]"
              disabled={action.isDisabled || isSubmitting}
              fullWidth={false}
              type="button"
              variant={action.variant}
              onClick={() => onPrimaryAction(action)}
            >
              {ActionIcon && !isSubmitting ? (
                <ActionIcon aria-hidden="true" className="h-4 w-4" />
              ) : null}
              {isSubmitting ? 'Working' : action.label}
            </Button>
          )}
        </div>

        <div className="absolute bottom-0 left-0">
          <ProfileTabs activeTab={activeTab} onTabChange={onTabChange} />
        </div>
      </div>
    </header>
  )
}

export default ProfileHeader
