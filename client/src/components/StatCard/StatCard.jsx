// One number with a name — the Administration dashboard's card rhythm. A
// presenter: label, value, an optional Lucide icon, and an optional hint line
// all arrive as props. The value renders in tabular figures so a row of cards
// lines up digit-for-digit. Callers: the Dashboard stat row (#501) and the
// admin user detail stats (#504).
const StatCard = ({ label, value, icon: Icon, hint }) => (
  <div className="bg-admin-surface rounded-2xl p-4 shadow-sm sm:p-5">
    <div className="flex items-center justify-between gap-2">
      <p className="text-admin-muted text-xs font-bold tracking-[0.08em] uppercase">
        {label}
      </p>
      {Icon ? (
        <span className="bg-admin-accent/10 text-admin-accent rounded-lg p-1.5">
          <Icon aria-hidden="true" className="h-4 w-4" />
        </span>
      ) : null}
    </div>
    <p className="text-admin-ink mt-2 text-2xl font-black tabular-nums sm:text-3xl">
      {value}
    </p>
    {hint ? (
      <p className="text-admin-muted mt-1 text-xs font-medium">{hint}</p>
    ) : null}
  </div>
)

export default StatCard
