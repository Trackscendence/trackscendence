const GameStartOverlay = () => {
  return (
    <div className="animate-wr-overlay fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FDE8CF]">
      <span className="animate-wr-scale-in text-[clamp(56px,8vw,112px)] font-black tracking-[-0.04em] text-[#2A1A08] motion-reduce:animate-none">
        Game On.
      </span>
      <span className="mt-4 text-sm font-medium text-[#9A7050]">
        Starting your game…
      </span>
      <div className="mt-8 flex gap-1.5">
        <span className="animate-wr-bar-1 h-2.5 w-2.5 rounded-full bg-[#E03325] motion-reduce:animate-none" />
        <span className="animate-wr-bar-2 h-2.5 w-2.5 rounded-full bg-[#F4C745] motion-reduce:animate-none" />
        <span className="animate-wr-bar-3 h-2.5 w-2.5 rounded-full bg-[#489E52] motion-reduce:animate-none" />
        <span className="animate-wr-bar-4 h-2.5 w-2.5 rounded-full bg-[#3684CC] motion-reduce:animate-none" />
      </div>
    </div>
  )
}

export default GameStartOverlay
