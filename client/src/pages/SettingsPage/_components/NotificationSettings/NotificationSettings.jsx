import SettingsCard from '../SettingsCard'

const NotificationSettings = () => {
  return (
    <SettingsCard title="Social alerts">
      <div className="space-y-4 text-sm text-[#6f5439]">
        <label className="flex items-start justify-between gap-4 rounded-lg border border-[#f1d8bd] px-4 py-3">
          <span>
            <span className="block font-semibold text-[#3d1200]">
              Friend requests
            </span>
            <span className="mt-1 block text-xs">
              Show friend requests in the lobby notification menu.
            </span>
          </span>
          <input
            checked
            readOnly
            aria-label="Friend request notifications enabled"
            className="mt-1 h-4 w-4 accent-[#e86d2f]"
            type="checkbox"
          />
        </label>
        <label className="flex items-start justify-between gap-4 rounded-lg border border-[#f1d8bd] px-4 py-3">
          <span>
            <span className="block font-semibold text-[#3d1200]">
              Direct messages
            </span>
            <span className="mt-1 block text-xs">
              Show unread message counts in the mailbox menu.
            </span>
          </span>
          <input
            checked
            readOnly
            aria-label="Direct message notifications enabled"
            className="mt-1 h-4 w-4 accent-[#e86d2f]"
            type="checkbox"
          />
        </label>
      </div>
    </SettingsCard>
  )
}

export default NotificationSettings
