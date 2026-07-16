const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'games', label: 'Games' },
  { id: 'friends', label: 'Friends' },
]

const ProfileTabs = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex w-full gap-1 lg:w-auto">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`flex-1 rounded-t-sm bg-[#AB7FE8] px-2 py-2.5 text-xs font-semibold text-white transition [text-shadow:0_1px_1px_rgba(61,18,0,0.35)] hover:brightness-95 focus:ring-2 focus:ring-[#AB7FE8]/40 focus:outline-none lg:flex-none lg:px-5 lg:py-2 lg:text-sm ${
            activeTab === tab.id
              ? 'shadow-[inset_0_-2px_0_#F4C745]'
              : 'shadow-[inset_0_-1px_0_rgba(61,18,0,0.24)] hover:shadow-[inset_0_-2px_0_#F4C745]'
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
