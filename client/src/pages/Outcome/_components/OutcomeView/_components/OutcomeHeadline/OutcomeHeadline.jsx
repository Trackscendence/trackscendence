// The result, treated like a card slapped on the table — oversized ink that
// scales in, echoing the waiting room's "Game On." so the flow reads as one
// continuous space. A presenter: title and subtitle are handed in.
const OutcomeHeadline = ({ title, subtitle }) => {
  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="animate-oc-headline text-[clamp(56px,9vw,120px)] leading-none font-black tracking-[-0.04em] text-[#3d1200] motion-reduce:animate-none">
        {title}
      </h1>
      <p className="animate-oc-rise-1 mt-4 max-w-md text-base font-medium text-[#9a5a2a] motion-reduce:animate-none">
        {subtitle}
      </p>
    </div>
  )
}

export default OutcomeHeadline
