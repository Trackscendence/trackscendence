// The champion banner above a completed bracket: who took the cup and what
// it paid out.
const ChampionCallout = ({ name, prizePoints }) => {
  return (
    <section className="mb-6 flex w-full items-center gap-3 rounded-2xl border-[0.5px] border-white/80 bg-[rgba(232,109,47,0.12)] px-5 py-4">
      <span aria-hidden="true" className="text-2xl leading-none">
        🏆
      </span>
      <div>
        <p className="text-sm font-bold text-[#2A1A08]">{name} takes the cup</p>
        {prizePoints != null ? (
          <p className="mt-0.5 text-xs text-[#9A7050]">
            {prizePoints} pts prize
          </p>
        ) : null}
      </div>
    </section>
  )
}

export default ChampionCallout
