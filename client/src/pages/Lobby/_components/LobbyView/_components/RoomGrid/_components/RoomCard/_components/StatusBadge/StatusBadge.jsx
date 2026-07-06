const BADGE_STYLES = {
  open: { colorClasses: 'bg-[#D0FAE5] text-[#007A55]', label: 'Open' },
  waiting: { colorClasses: 'bg-[#E8F4FD] text-[#1565C0]', label: 'Waiting' },
  inGame: { colorClasses: 'bg-[#FEF3C6] text-[#BB4D00]', label: 'In Game' },
}

const StatusBadge = ({ variant }) => {
  const badge = BADGE_STYLES[variant] ?? BADGE_STYLES.open

  return (
    <span
      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.colorClasses}`}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full bg-current"
      />
      {badge.label}
    </span>
  )
}

export default StatusBadge
