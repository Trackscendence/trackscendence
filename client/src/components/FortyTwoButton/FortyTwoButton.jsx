import fortyTwoLogo from '@/assets/auth/42-logo.svg'
import Spinner from '@/components/Spinner'
import { resolveFortyTwoButtonState } from './_utils/resolveFortyTwoButtonState'

const FortyTwoButton = ({
  comingSoon = true,
  isChecking = false,
  isConnecting = false,
  className = '',
  ...props
}) => {
  const { isDisabled, title, mode } = resolveFortyTwoButtonState({
    comingSoon,
    isChecking,
    isConnecting,
  })

  return (
    <button
      type="button"
      disabled={isDisabled}
      title={title}
      className={`flex w-full items-center justify-center gap-3 rounded-md bg-[#081934] px-4 py-2.5 text-sm font-semibold tracking-widest text-white uppercase transition enabled:hover:bg-[#0d2547] disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {mode === 'connecting' ? (
        <>
          <Spinner size={18} className="text-white motion-reduce:hidden" />
          Connecting to 42…
        </>
      ) : (
        <>
          <img src={fortyTwoLogo} alt="42 logo" className="h-5 w-5" />
          Continue with 42
          {mode === 'checking' ? (
            <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-white/80">
              Checking
            </span>
          ) : null}
          {mode === 'comingSoon' ? (
            <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-white/80">
              Soon
            </span>
          ) : null}
        </>
      )}
    </button>
  )
}

export default FortyTwoButton
