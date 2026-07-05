import fortyTwoLogo from '@/assets/auth/42-logo.svg'

const FortyTwoButton = ({ comingSoon = true, className = '', ...props }) => {
  return (
    <button
      type="button"
      disabled={comingSoon}
      title={comingSoon ? 'Coming soon' : undefined}
      className={`flex w-full items-center justify-center gap-3 rounded-md bg-[#081934] px-4 py-2.5 text-sm font-semibold tracking-widest text-white uppercase transition enabled:hover:bg-[#0d2547] disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      <img src={fortyTwoLogo} alt="42 logo" className="h-5 w-5" />
      Continue with 42
      {comingSoon ? (
        <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-white/80">
          Soon
        </span>
      ) : null}
    </button>
  )
}

export default FortyTwoButton
