// The setup half of the two-factor card: the QR code, manual key, recovery
// codes, and the confirm form. A presenter — the `setup` payload and the code
// field are handed down by the container.
const TwoFactorSetup = ({
  setup,
  code,
  isSubmitting,
  onCodeChange,
  onConfirm,
}) => {
  return (
    <div className="rounded-xl border border-[#e6dccf] bg-[#fdf7f0] p-5">
      <p className="text-xs font-bold tracking-[0.12em] text-[#a07a5c] uppercase">
        Setup
      </p>

      {setup ? (
        <div className="mt-4 space-y-5">
          <div className="rounded-lg border border-[#e6dccf] bg-white p-4">
            <p className="text-sm font-medium text-[#8a6a52]">
              Scan this QR code with your authenticator app
            </p>
            <img
              className="mt-4 w-full rounded-md border border-[#e6dccf] bg-white p-3"
              src={setup.qrCodeDataUrl}
              alt="Two-factor setup QR code"
            />
          </div>

          <div className="rounded-lg border border-[#e6dccf] bg-white p-4">
            <p className="text-sm font-medium text-[#8a6a52]">Manual key</p>
            <p className="mt-2 font-mono text-sm break-all text-[#3d1200]">
              {setup.manualEntryKey}
            </p>
            <p className="mt-2 text-xs text-[#a07a5c]">
              Use this if you prefer to type the secret into your app.
            </p>
          </div>

          <div className="rounded-lg border border-[#f0d8a2] bg-[#fff9ea] p-4">
            <p className="text-sm font-semibold text-[#7d5a12]">
              Save these recovery codes now
            </p>
            <p className="mt-2 text-sm text-[#7d5a12]">
              Each code works once and will not be shown again after you leave
              this page or restart setup.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {setup.recoveryCodes.map((recoveryCode) => (
                <code
                  className="rounded-md border border-[#f0d8a2] bg-white px-3 py-2 text-sm font-semibold tracking-[0.15em] text-[#6c4d10]"
                  key={recoveryCode}
                >
                  {recoveryCode}
                </code>
              ))}
            </div>
          </div>

          <form className="space-y-4" onSubmit={onConfirm}>
            <label className="block">
              <span className="text-sm font-medium text-[#6b5442]">
                Enter one authenticator code to confirm setup
              </span>
              <input
                className="mt-2 w-full rounded-lg border border-[#d8cbbc] px-3 py-2 text-base tracking-[0.35em] transition outline-none focus:border-[#489E52] focus:ring-2 focus:ring-[#489E52]/20"
                name="code"
                type="text"
                autoComplete="one-time-code"
                inputMode="numeric"
                value={code}
                onChange={onCodeChange}
                required
              />
            </label>

            <button
              className="w-full rounded-xl bg-[#489E52] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3d8746] disabled:cursor-not-allowed disabled:bg-[#a9cbad]"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Confirming setup' : 'Confirm and enable 2FA'}
            </button>
          </form>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-[#d8cbbc] bg-white p-5 text-sm text-[#8a6a52]">
          Start setup to generate a QR code, a manual entry key, and a fresh set
          of recovery codes.
        </div>
      )}
    </div>
  )
}

export default TwoFactorSetup
