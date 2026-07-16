// The 32px column of elbow lines between two bracket rounds. Pure geometry
// from one prop: with the columns laid out as equal flex cells, the midpoint
// of match i in an n-match round sits at (2i + 1) / 2n of the column height,
// and each child match's midpoint is exactly the average of its two parents'.
// The SVG is drawn in a 0-100 vertical coordinate space and stretched to the
// column height (preserveAspectRatio="none"); non-scaling strokes keep the
// hairlines at 1px, and elbows are only ever horizontal or vertical, so the
// non-uniform scale never distorts them. Works for any power-of-two round
// (size 4 and size 8 brackets alike).
const buildConnectorPaths = (fromMatchCount) => {
  const toMatchCount = fromMatchCount / 2

  return Array.from({ length: toMatchCount }, (unused, pairIndex) => {
    const topY = ((4 * pairIndex + 1) * 100) / (2 * fromMatchCount)
    const bottomY = ((4 * pairIndex + 3) * 100) / (2 * fromMatchCount)
    const childY = ((2 * pairIndex + 1) * 100) / (2 * toMatchCount)

    return {
      key: `pair-${pairIndex}`,
      d: `M0 ${topY} H16 M0 ${bottomY} H16 M16 ${topY} V${bottomY} M16 ${childY} H32`,
    }
  })
}

// The h-5/mb-2 spacer and h-10 footer mirror the round columns' label and
// prize rows in TournamentBracket, so the svg spans exactly the match area.
const BracketConnectors = ({ fromMatchCount }) => {
  if (fromMatchCount < 2) return null

  return (
    <div aria-hidden="true" className="flex w-8 shrink-0 flex-col">
      <div className="mb-2 h-5" />
      <svg
        className="min-h-0 w-full flex-1"
        preserveAspectRatio="none"
        viewBox="0 0 32 100"
      >
        {buildConnectorPaths(fromMatchCount).map((path) => (
          <path
            key={path.key}
            d={path.d}
            fill="none"
            stroke="#C9B8A8"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <div className="h-10" />
    </div>
  )
}

export default BracketConnectors
