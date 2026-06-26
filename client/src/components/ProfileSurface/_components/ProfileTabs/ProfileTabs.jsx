const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'games', label: 'Games' },
  { id: 'friends', label: 'Friends' },
]

const ProfileTabs = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex flex-wrap gap-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`rounded-t-sm px-5 py-2 text-sm font-semibold text-[#24356F] transition focus:ring-2 focus:ring-[#24356F]/30 focus:outline-none ${
            activeTab === tab.id
              ? 'bg-[#F4C745] shadow-[inset_0_-2px_0_#24356F]'
              : 'bg-[#F4C745]/45 hover:bg-[#F4C745]/75'
          }`}
          type="button"
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export default ProfileTabs
