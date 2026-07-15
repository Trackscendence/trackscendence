import { Trophy } from 'lucide-react'
import BracketMatch from './_components/BracketMatch'

// The bracket card from the tournament design: name and round summary on top,
// one column per round with its matches vertically centred, and the points
// prize under the final. Pure presenter; the container shapes the data with
// buildBracketView.
const TournamentBracket = ({ bracket }) => {
  const lastRoundIndex = bracket.rounds.length - 1

  return (
    <section className="rounded-3xl bg-[#fff7ea] p-6 sm:p-8">
      <h2 className="text-xl font-bold text-[#2E2D2D]">{bracket.name}</h2>
      <p className="mt-1 text-sm text-[#8a7660]">{bracket.summary}</p>

      <div className="mt-8 flex flex-col gap-10 lg:flex-row">
        {bracket.rounds.map((round, roundIndex) => (
          <div key={round.key} className="flex flex-1 flex-col">
            <p className="text-xs font-bold tracking-[0.15em] text-[#b3a18c] uppercase">
              {round.label}
            </p>
            <div className="flex flex-1 flex-col justify-around gap-6 pt-4">
              {round.matches.map((match) => (
                <div key={match.key} className="space-y-3">
                  <BracketMatch slots={match.slots} />
                  {roundIndex === lastRoundIndex &&
                  bracket.prizePoints != null ? (
                    <p className="flex items-center gap-2 text-sm font-semibold text-[#8a7660]">
                      <Trophy
                        aria-hidden="true"
                        className="h-4 w-4 text-[#E86D2F]"
                        strokeWidth={2.1}
                      />
                      {bracket.prizePoints} pts
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default TournamentBracket
