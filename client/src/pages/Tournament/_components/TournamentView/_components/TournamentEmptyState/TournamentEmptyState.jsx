import { Trophy } from 'lucide-react'

// Shown while no tournament is running — which is every visit until the
// tournament backend lands. Honest copy, no mock brackets.
const TournamentEmptyState = () => {
  return (
    <section className="mx-auto flex w-full max-w-md flex-col items-center rounded-3xl bg-[#fff7ea] px-8 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fbe3cd] text-[#E86D2F]">
        <Trophy aria-hidden="true" className="h-6 w-6" strokeWidth={2.1} />
      </div>
      <h2 className="mt-5 text-lg font-black text-[#3d1200]">
        Tournaments are coming soon
      </h2>
      <p className="mt-2 text-sm leading-6 text-[#9a7050]">
        Bracket play is on its way. When tournaments open, the live bracket will
        appear right here.
      </p>
    </section>
  )
}

export default TournamentEmptyState
