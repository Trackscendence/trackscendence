import ReverseCorner from '@/assets/cards/symbols/reverse-center.svg?react'
import SkipCorner from '@/assets/cards/symbols/skip-symbol.svg?react'

const CORNER_TEXT_CLASS =
  'absolute z-10 text-[34px] leading-none font-black text-white [-webkit-text-stroke:1px_black] [paint-order:stroke_fill]'

const WILD_DIAMONDS = [
  'top-1.5 left-[11px] bg-[#EA5A2A]',
  'top-1.5 right-[7px] bg-[#F4C745]',
  'bottom-2.5 left-[11px] bg-[#489E52]',
  'right-[7px] bottom-2.5 bg-[#3684CC]',
]

// Full corner-overlay SVGs render off-center at this card size.
const renderTextCorners = (label) => (
  <>
    <span className={`${CORNER_TEXT_CLASS} top-2 left-1.5`}>{label}</span>
    <span className={`${CORNER_TEXT_CLASS} right-3 bottom-2 rotate-180`}>
      {label}
    </span>
  </>
)

const renderIconCorners = (Icon, props = {}) => (
  <>
    <Icon
      {...props}
      aria-hidden="true"
      className="absolute top-2 left-1.5 z-10 h-8 w-8 text-white"
      focusable="false"
    />
    <Icon
      {...props}
      aria-hidden="true"
      className="absolute right-3 bottom-2 z-10 h-8 w-8 rotate-180 text-white"
      focusable="false"
    />
  </>
)

const renderWildCorners = () => (
  <>
    {WILD_DIAMONDS.map((className) => (
      <span
        aria-hidden="true"
        className={`absolute z-10 h-[22px] w-[22px] rotate-45 ${className}`}
        key={className}
      />
    ))}
  </>
)

const Corners = ({ label, type }) => {
  if (label) return renderTextCorners(label)
  if (type === 'skip') return renderIconCorners(SkipCorner)
  if (type === 'reverse') {
    return renderIconCorners(ReverseCorner, {
      viewBox: '29 63 64 64',
    })
  }
  if (type === 'wild') return renderWildCorners()
  return null
}

export default Corners
