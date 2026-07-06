// The settings navigation, mirroring the Figma sidebar. Account and Security
// are live; Notifications, Privacy, Preferences and Danger Zone are shown but
// greyed and non-interactive until those features exist. A hook-free presenter:
// the page owns which section is active and what selecting one does.

const ICON_PATHS = {
  account:
    'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20a7.5 7.5 0 0 1 15 0',
  security: 'M12 3 5 6v5c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6l-7-3Z',
  notifications:
    'M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6ZM9.5 20a2.5 2.5 0 0 0 5 0',
  privacy: 'M6 10V7a6 6 0 0 1 12 0v3M5 10h14v10H5Z',
  preferences: 'M4 7h11M19 7h1M4 17h1M9 17h11M14 7v0M7 17v0',
  danger: 'M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13',
}

const Icon = ({ name }) => (
  <svg
    aria-hidden="true"
    className="h-[17px] w-[17px] shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={ICON_PATHS[name]} />
  </svg>
)

const SettingsSidebar = ({ items, activeKey, onSelect }) => (
  <nav className="flex w-full flex-col gap-2 rounded-2xl border border-[#e8893a2e] bg-white p-2 shadow-[0_10px_30px_rgba(61,18,0,0.05)] sm:w-64">
    {items.map((item) => {
      const isActive = item.key === activeKey
      const activeText = item.danger ? 'text-[#c94b4d]' : 'text-[#E8893A]'
      const tone = !item.enabled
        ? 'cursor-not-allowed text-[#b8a893]'
        : isActive
          ? `bg-[#e8893a1a] ${activeText}`
          : 'text-[#3d1200] hover:bg-[#fbf1e6]'

      return (
        <button
          key={item.key}
          type="button"
          disabled={!item.enabled}
          aria-disabled={!item.enabled}
          aria-current={isActive ? 'page' : undefined}
          onClick={item.enabled ? () => onSelect(item.key) : undefined}
          className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition focus-visible:ring-2 focus-visible:ring-[#E8893A] focus-visible:outline-none ${tone}`}
        >
          <Icon name={item.key} />
          <span className="flex flex-col">
            <span className="flex items-center gap-2 text-sm font-semibold">
              {item.label}
              {!item.enabled ? (
                <span className="rounded-full bg-[#efe4d6] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-[#a08a6a] uppercase">
                  Soon
                </span>
              ) : null}
            </span>
            <span className="text-xs text-[#8a6845]">{item.description}</span>
          </span>
        </button>
      )
    })}
  </nav>
)

export default SettingsSidebar
