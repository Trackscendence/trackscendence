import { Fragment } from 'react'
import BracketConnectors from './_components/BracketConnectors'
import BracketMatch from './_components/BracketMatch'

// The bracket card from the tournament design: name and round summary on a
// translucent white card, one column per round with connector elbows between
// rounds, and the points prize under the final. Every column keeps the same
// fixed-height label and footer rows and stretches to the same height, and
// each match is centred in an equal flex cell — that equal-cell layout is what
// makes each child match sit exactly between its two parents, which the
// connector geometry relies on. Pure presenter; the container shapes the data
// with buildBracketView.
const TournamentBracket = ({ bracket }) => {
  const lastRoundIndex = bracket.rounds.length - 1

  return (
    <section className="rounded-2xl border-[0.5px] border-white/80 bg-white/50 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] sm:p-8">
      <h2 className="text-base font-bold text-[#2A1A08]">{bracket.name}</h2>
      <p className="mt-0.5 text-xs text-[#9A7050]">{bracket.summary}</p>

      <div className="mt-5 flex items-stretch overflow-x-auto pb-2">
        {bracket.rounds.map((round, roundIndex) => (
          <Fragment key={round.key}>
            {roundIndex > 0 ? (
              <BracketConnectors
                fromMatchCount={bracket.rounds[roundIndex - 1].matches.length}
              />
            ) : null}
            <div className="flex min-w-40 flex-1 flex-col">
              <p className="mb-2 h-5 text-[11px] font-semibold tracking-[0.05em] text-[#C9B8A8] uppercase">
                {round.label}
              </p>
              <div className="flex flex-1 flex-col">
                {round.matches.map((match) => (
                  <div
                    key={match.key}
                    className="flex flex-1 items-center py-2"
                  >
                    <BracketMatch slots={match.slots} />
                  </div>
                ))}
              </div>
              <div className="flex h-10 items-center gap-1.5 pt-2">
                {roundIndex === lastRoundIndex &&
                bracket.prizePoints != null ? (
                  <>
                    <span aria-hidden="true" className="text-lg leading-none">
                      🏆
                    </span>
                    <span className="text-[11px] text-[#9A7050]">
                      {bracket.prizePoints} pts
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </Fragment>
        ))}
      </div>
    </section>
  )
}

export default TournamentBracket
