import topTriangle from '@/assets/game/polygon-3.svg'
import bottomTriangle from '@/assets/game/polygon-2.svg'

const ArrowTriangle = ({ alt, direction, src }) => {
  const directionClass = direction === 'counter-clockwise' ? 'scale-x-[-1]' : ''

  return (
    <img
      alt={alt}
      className={`h-[67px] w-[78px] ${directionClass}`}
      src={src}
    />
  )
}

const DirectionIndicator = ({ children, direction }) => {
  return (
    <div
      aria-label={`Play direction is ${direction}`}
      className="flex min-w-28 flex-col items-center justify-center gap-4"
      role="group"
    >
      <ArrowTriangle
        alt="Top play direction marker"
        direction={direction}
        src={topTriangle}
      />
      {children}
      <ArrowTriangle
        alt="Bottom play direction marker"
        direction={direction}
        src={bottomTriangle}
      />
    </div>
  )
}

export default DirectionIndicator
