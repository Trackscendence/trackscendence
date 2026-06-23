import backCard from '@/assets/cards/back.png'
import Symbol from './_components/Symbol'

const COLOR_STYLES = {
  red: ['bg-[#EA5A2A]', 'text-[#EA5A2A]'],
  blue: ['bg-[#3684CC]', 'text-[#3684CC]'],
  yellow: ['bg-[#F4C745]', 'text-[#F4C745]'],
  green: ['bg-[#489E52]', 'text-[#489E52]'],
  wild: ['bg-[#000000]', 'text-[#000000]'],
}

const CARD_BASE =
  'relative h-[213px] w-[154px] shrink-0 select-none overflow-hidden rounded-[15.5px] border border-black bg-transparent p-0 transition-transform'

const Card = ({
  color = 'wild',
  type = 'number',
  value,
  faceDown = false,
  playable = true,
  selected = false,
  className = '',
  onClick,
  ...props
}) => {
  const [backgroundClass, textClass] = COLOR_STYLES[color] ?? COLOR_STYLES.wild
  const stateClass = playable
    ? 'cursor-pointer'
    : 'cursor-not-allowed opacity-40'
  const selectedClass = selected ? 'scale-110 ring-4 ring-white' : ''
  const ariaLabel = faceDown
    ? 'face-down card'
    : `${color} ${type}${value != null ? ` ${value}` : ''} card`

  if (faceDown) {
    return (
      <button
        {...props}
        type="button"
        aria-label={ariaLabel}
        className={`${CARD_BASE} ${stateClass} ${selectedClass} ${className}`}
        disabled={!playable}
        onClick={playable ? onClick : undefined}
      >
        <img
          src={backCard}
          alt="face-down card"
          className="h-full w-full rounded-[15.5px] object-cover"
        />
      </button>
    )
  }

  return (
    <button
      {...props}
      type="button"
      aria-label={ariaLabel}
      className={`${CARD_BASE} ${stateClass} ${selectedClass} ${className}`}
      disabled={!playable}
      onClick={playable ? onClick : undefined}
    >
      <div
        className={`absolute top-[6px] left-[6px] h-[201px] w-[142px] rounded-[10px] border-4 border-white ${backgroundClass}`}
      >
        {type === 'number' ? (
          <>
            <span className="absolute top-1.5 left-2 text-sm leading-none font-black text-white">
              {value}
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative flex h-[99px] w-[99px] items-center justify-center">
                <div className="absolute h-[70px] w-[70px] rotate-45 bg-white" />
                <span
                  className={`relative z-10 text-5xl leading-none font-black ${textClass}`}
                >
                  {value}
                </span>
              </div>
            </div>
            <span className="absolute right-2 bottom-1.5 rotate-180 text-sm leading-none font-black text-white">
              {value}
            </span>
          </>
        ) : (
          <Symbol type={type} />
        )}
      </div>
    </button>
  )
}

export default Card
