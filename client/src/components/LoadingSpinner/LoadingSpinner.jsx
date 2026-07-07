import ProgressBar from '@/components/ProgressBar'
import Spinner from '@/components/Spinner'

// The loading state reads as the deck being dealt: four UNO-coloured pips light
// up left to right under a big display word. `className` carries the caller's
// surface (and ink) so each screen keeps its own background while loading.
//
// Back-compatible: `message` and `className` are the original API. `heading`
// (the big display word) and `showProgress` (the boot-gate bar) are optional, so
// existing callers render unchanged — the display word falls back to `message`.

// The four suits, only ever used together — the signature "deal". Green is the
// one theme token (`bg-uno-green`); the others already live inline in the app.
const PIPS = [
  { key: 'red', color: 'bg-[#E03325]', animate: 'animate-wr-dot-1' },
  { key: 'yellow', color: 'bg-[#FFB04F]', animate: 'animate-wr-dot-2' },
  { key: 'green', color: 'bg-uno-green', animate: 'animate-wr-dot-3' },
  { key: 'blue', color: 'bg-[#3684CC]', animate: 'animate-wr-dot-4' },
]

const LoadingSpinner = ({
  message = 'Loading',
  className = 'bg-[#f4f7f2] text-[#27352f]',
  heading,
  showProgress = false,
}) => {
  const displayWord = heading ?? message
  // When a distinct heading is given, the message plays its status-line role;
  // otherwise the message is already the display word, so the line is just the
  // spinner tell.
  const statusText = heading ? message : null

  return (
    <div
      className={`flex min-h-screen flex-col items-center justify-center px-6 text-center ${className}`}
    >
      <div className="mb-6 flex gap-3">
        {PIPS.map((pip) => (
          <span
            key={pip.key}
            className={`h-3.5 w-3.5 rounded-full ${pip.color} ${pip.animate} motion-reduce:animate-none`}
          />
        ))}
      </div>

      <h1 className="text-[clamp(72px,11vw,160px)] leading-none font-black tracking-[-0.04em] text-[#2A1A08] uppercase">
        {displayWord}
      </h1>

      <div className="mt-5 flex items-center gap-2 text-[#2A1A08]/70">
        <Spinner size={16} className="text-[#2A1A08]/60 motion-reduce:hidden" />
        {statusText ? (
          <span className="text-sm font-semibold tracking-[0.12em] uppercase">
            {statusText}
          </span>
        ) : null}
      </div>

      {showProgress ? (
        <ProgressBar indeterminate className="mt-8 w-[min(320px,70vw)]" />
      ) : null}
    </div>
  )
}

export default LoadingSpinner
