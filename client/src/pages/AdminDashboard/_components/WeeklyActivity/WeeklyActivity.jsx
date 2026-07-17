// The two weekly panels (#501): games played and new players, one accent-hue
// bar per day. MVP keeps the marks as plain CSS bars (Chart.js waits for P2
// Analytics). Single series per panel, so the panel title is the legend; each
// bar carries its value in the accessible name and native tooltip, and the
// header shows the week's total instead of numbering every bar.

const formatWeekday = (isoDay) => {
  const day = new Date(`${isoDay}T00:00:00Z`)
  if (Number.isNaN(day.getTime())) return '?'
  return day.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' })
}

// Stateless helper, private to this file: one titled card with seven bars.
const WeeklyBarsPanel = ({ title, series, unit }) => {
  const total = series.reduce((sum, entry) => sum + entry.count, 0)
  const maxCount = Math.max(...series.map((entry) => entry.count), 1)

  return (
    <div className="bg-admin-surface rounded-2xl p-4 shadow-sm sm:p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-admin-muted text-xs font-bold tracking-[0.08em] uppercase">
          {title}
        </h2>
        <p className="text-admin-ink text-sm font-black tabular-nums">
          {total}
          <span className="text-admin-muted ml-1 font-semibold">this week</span>
        </p>
      </div>
      {series.length === 0 ? (
        <p className="text-admin-muted mt-6 text-sm font-medium">
          No data yet.
        </p>
      ) : (
        <ul className="mt-4 flex h-28 items-end gap-2">
          {series.map((entry) => (
            <li key={entry.day} className="flex h-full flex-1 flex-col">
              <span
                role="img"
                aria-label={`${entry.count} ${unit} on ${entry.day}`}
                title={`${entry.day}: ${entry.count}`}
                className="flex h-full items-end"
              >
                <span
                  aria-hidden="true"
                  className={`w-full rounded-t ${
                    entry.count > 0 ? 'bg-admin-accent' : 'bg-admin-ink/10'
                  }`}
                  style={{
                    height:
                      entry.count > 0
                        ? `${Math.max((entry.count / maxCount) * 100, 4)}%`
                        : '3px',
                  }}
                />
              </span>
              <span className="text-admin-muted mt-1.5 text-center text-[10px] font-semibold">
                {formatWeekday(entry.day)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const WeeklyActivity = ({ gamesSeries, playersSeries }) => (
  <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
    <WeeklyBarsPanel title="Games played" series={gamesSeries} unit="games" />
    <WeeklyBarsPanel
      title="New players"
      series={playersSeries}
      unit="new players"
    />
  </div>
)

export default WeeklyActivity
