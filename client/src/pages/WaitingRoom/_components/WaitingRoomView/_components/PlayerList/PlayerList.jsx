const AVATAR_BASE =
  'flex h-[72px] w-[72px] items-center justify-center rounded-full text-base font-black tracking-[-0.03em] text-white shadow-[0_2px_12px_rgba(0,0,0,0.14)]'

const PlayerList = ({ you, opponent }) => {
  return (
    <div className="mb-11 grid grid-cols-2 gap-4">
      <div
        className={`${AVATAR_BASE} ${you.colorClass}`}
        role="img"
        aria-label={you.name}
      >
        {you.initials}
      </div>
      {opponent ? (
        <div
          className={`animate-wr-pop motion-reduce:animate-none ${AVATAR_BASE} ${opponent.colorClass}`}
          role="img"
          aria-label={opponent.name}
        >
          {opponent.initials}
        </div>
      ) : (
        <div
          className="animate-wr-breathe h-[72px] w-[72px] rounded-full border-[1.5px] border-dashed border-[rgba(0,0,0,0.18)] bg-[rgba(0,0,0,0.03)] motion-reduce:animate-none"
          role="img"
          aria-label="Waiting for an opponent"
        />
      )}
    </div>
  )
}

export default PlayerList
