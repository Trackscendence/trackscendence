const WaitingHeadline = () => {
  return (
    <div className="mb-[14px] flex items-end">
      <span className="text-[clamp(72px,11vw,160px)] leading-none font-black tracking-[-0.04em] text-[#2A1A08]">
        Waiting
      </span>
      <span className="flex items-end gap-2 pb-[clamp(6px,1.1vw,16px)] pl-3">
        <span className="animate-wr-dot-1 h-5 w-5 rounded-full bg-[#3684CC] motion-reduce:animate-none" />
        <span className="animate-wr-dot-2 h-5 w-5 rounded-full bg-[#3684CC] motion-reduce:animate-none" />
        <span className="animate-wr-dot-3 h-5 w-5 rounded-full bg-[#3684CC] motion-reduce:animate-none" />
      </span>
    </div>
  )
}

export default WaitingHeadline
