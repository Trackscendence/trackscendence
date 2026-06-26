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
          className={`rounded-t-sm px-5 py-2 text-sm font-semibold transition focus:ring-2 focus:ring-[#e86d2f]/30 focus:outline-none ${
            activeTab === tab.id
              ? 'bg-white text-[#e86d2f]'
              : 'text-[#7a3810] hover:bg-white/35'
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
