// A small floating card shown while its trigger is hovered or holds focus.
// Pure CSS (named group + hover/focus-within): no portal, no state, no
// listeners. The panel is display-hidden at rest so it never affects layout
// or scroll range, and pointer events pass through it so it cannot steal the
// trigger's clicks or flicker on mouse movement. It floats from the trigger's
// vertical midpoint, which keeps it inside scroll containers that would clip
// a panel positioned fully outside its row. The panel is aria-hidden: it is
// a visual affordance, so triggers must carry the same information for screen
// readers themselves (e.g. visually hidden text inside the trigger).
const HoverCard = ({ children, className = '', content }) => {
  return (
    <div className={`group/hovercard relative ${className}`}>
      {children}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 z-20 hidden w-max max-w-48 -translate-x-1/2 rounded-[10px] border border-black/10 bg-white px-3 py-2 shadow-lg group-focus-within/hovercard:block group-hover/hovercard:block"
      >
        {content}
      </div>
    </div>
  )
}

export default HoverCard
