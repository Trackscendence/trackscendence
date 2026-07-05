// The design places a search affordance next to the heading, but the Figma
// node is an unfinished stub (an empty strip with a lone magnifying glass),
// so the heading stands alone until search is actually designed.
const PlayHeading = () => {
  return (
    <h1 className="text-[clamp(48px,6vw,80px)] leading-none font-black tracking-[-0.025em] text-[#E86D2F]">
      PLAY
    </h1>
  )
}

export default PlayHeading
