// The stacked table markers beside the discard pile. At rest they are the
// static grey triangles from the design. Each one doubles as the anchor for
// the UNO! badge: when a player is down to one card the matching triangle
// lights up orange and carries the badge — the top triangle for an opponent,
// the bottom one (flipped to point down) for the bottom-seat player.

// Same shape as the original polygon assets (78x67, pointing up).
const TRIANGLE_PATH = 'M38.9712 0L77.9423 66.75H4.95911e-05L38.9712 0Z'
// The UNO pill's orange, so marker and badge read as one call-out.
const UNO_ORANGE = '#EA5A2A'

const TriangleMarker = ({ alt, fill, isFlipped, overlay }) => (
  <div className="relative">
    <svg
      aria-label={alt}
      className={[
        'h-[67px] w-[78px] transition-transform duration-300',
        isFlipped ? 'rotate-180' : '',
      ].join(' ')}
      role="img"
      viewBox="0 0 78 67"
    >
      <path
        className="transition-[fill] duration-300"
        d={TRIANGLE_PATH}
        fill={overlay ? UNO_ORANGE : fill}
      />
    </svg>
    {overlay ? (
      <div className="absolute inset-0 grid place-items-center">{overlay}</div>
    ) : null}
  </div>
)

const DirectionIndicator = ({ bottomOverlay, direction, topOverlay }) => {
  return (
    <div
      aria-label={`Play direction is ${direction}`}
      className="flex min-w-28 flex-col items-center justify-center gap-4"
      role="group"
    >
      <TriangleMarker
        alt="Top play direction marker"
        fill="#969595"
        overlay={topOverlay}
      />
      <TriangleMarker
        alt="Bottom play direction marker"
        fill="#666363"
        isFlipped={Boolean(bottomOverlay)}
        overlay={bottomOverlay}
      />
    </div>
  )
}

export default DirectionIndicator
