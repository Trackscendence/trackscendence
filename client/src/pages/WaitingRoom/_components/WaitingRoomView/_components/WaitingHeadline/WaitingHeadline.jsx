const WaitingHeadline = () => {
  return (
    <div className="mb-3 flex items-end">
      <span className="text-[clamp(56px,14vw,160px)] leading-none font-black tracking-[-0.04em] text-[#2A1A08]">
        Waiting
      </span>
      <span className="flex items-end gap-2 pb-[clamp(4px,1vw,12px)] pl-2 sm:pl-3">
        <span className="animate-wr-dot-1 h-4 w-4 rounded-full bg-[#3684CC] motion-reduce:animate-none sm:h-5 sm:w-5" />
        <span className="animate-wr-dot-2 h-4 w-4 rounded-full bg-[#3684CC] motion-reduce:animate-none sm:h-5 sm:w-5" />
        <span className="animate-wr-dot-3 h-4 w-4 rounded-full bg-[#3684CC] motion-reduce:animate-none sm:h-5 sm:w-5" />
      </span>
    </div>
  )
}

export default WaitingHeadline
