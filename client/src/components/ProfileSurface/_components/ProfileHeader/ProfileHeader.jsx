import Button from '@/components/Button'
import ProfileAvatar from '../ProfileAvatar'
import ProfileStatStrip from '../ProfileStatStrip'
import ProfileTabs from '../ProfileTabs'
import profileActions from '../../_utils/profileActions'
import profileFormatters from '../../_utils/profileFormatters'

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
  const action = profileActions.getProfileActionState({
    isOwnProfile,
    relationship,
  })
  const metadata = isOwnProfile ? profile.email : `@${profile.username}`

  return (
    <header>
      <div className="bg-[#ffd099] px-4 py-6 text-[#3d1200] sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center lg:gap-10">
            <ProfileAvatar profile={profile} />
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold break-words text-[#3d1200] sm:text-[28px]">
                {profileFormatters.getDisplayName(profile)}
              </h1>
              <p className="mt-1 text-sm break-all text-[#7a3810]">
                {metadata}
              </p>
              <ProfileStatStrip stats={stats} />
            </div>
          </div>

          <Button
            className="h-9 w-full rounded-none sm:w-[138px]"
            disabled={action.isDisabled || isSubmitting}
            fullWidth={false}
            type="button"
            variant={action.variant}
            onClick={onPrimaryAction}
          >
            {isSubmitting ? 'Working' : action.label}
          </Button>
        </div>

        <ProfileTabs activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    </header>
  )
}

export default ProfileHeader
