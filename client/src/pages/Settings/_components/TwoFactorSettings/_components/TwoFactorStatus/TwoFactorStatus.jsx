// The status half of the two-factor card: current state, the start/regenerate
// and disable controls, and any feedback. A presenter — every value and action
// comes from the container.
const STATUS = {
  enabled: {
    badge: 'bg-[#e8f4ea] text-[#2f6b39]',
    label: 'Enabled',
    line: 'Two-factor authentication is on for your account.',
    action: 'Regenerate 2FA setup',
  },
  pending: {
    badge: 'bg-[#fff6df] text-[#916b12]',
    label: 'Pending',
    line: 'A setup is pending. Scan it and verify one code to finish.',
    action: 'Restart setup',
  },
  disabled: {
    badge: 'bg-[#f2ede7] text-[#8a6a52]',
    label: 'Disabled',
    line: 'Two-factor authentication is off.',
    action: 'Start setup',
  },
}

const TwoFactorStatus = ({
  state,
  isSubmitting,
  message,
  error,
  validationDetails,
  showPendingHint,
  onStartSetup,
  onDisable,
}) => {
  const status = STATUS[state]

  return (
    <div className="rounded-xl border border-[#e6dccf] bg-[#fdf7f0] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.12em] text-[#a07a5c] uppercase">
            Status
          </p>
          <p className="mt-2 text-sm text-[#6b5442]">{status.line}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${status.badge}`}
        >
          {status.label}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          className="rounded-xl bg-[#489E52] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3d8746] disabled:cursor-not-allowed disabled:bg-[#a9cbad]"
          type="button"
          disabled={isSubmitting}
          onClick={onStartSetup}
        >
          {status.action}
        </button>

        {state !== 'disabled' && (
          <button
            className="rounded-xl border border-[#d8cbbc] px-4 py-2.5 text-sm font-semibold text-[#6b5442] transition hover:border-[#b6523b] hover:text-[#b6523b] disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={isSubmitting}
            onClick={onDisable}
          >
            Disable 2FA
          </button>
        )}
      </div>

      <p className="mt-4 text-sm text-[#8a6a52]">
        Recovery codes are a backup second factor. If you lose your
        authenticator app, you can still use one after your password.
      </p>

      {message ? (
        <p className="mt-4 rounded-lg border border-[#bcdcc0] bg-[#eef7ef] px-3 py-2 text-sm text-[#2f6b39]">
          {message}
        </p>
      ) : null}

      {validationDetails.length > 0 ? (
        <div className="mt-4 rounded-lg border border-[#e2a496] bg-[#fff1ed] px-3 py-2 text-sm text-[#8a321f]">
          {validationDetails.map((detail) => (
            <p key={detail}>{detail}</p>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-lg border border-[#e2a496] bg-[#fff1ed] px-3 py-2 text-sm text-[#8a321f]">
          {error}
        </p>
      ) : null}

      {showPendingHint ? (
        <div className="mt-6 rounded-lg border border-[#e6dccf] bg-white p-4 text-sm text-[#8a6a52]">
          A setup is pending, but the QR code and recovery codes only showed
          when it started. Use <strong>Restart setup</strong> for a fresh secret
          and new recovery codes.
        </div>
      ) : null}
    </div>
  )
}

export default TwoFactorStatus
