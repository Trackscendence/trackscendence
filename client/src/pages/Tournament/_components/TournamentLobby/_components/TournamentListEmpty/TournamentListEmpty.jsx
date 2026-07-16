import { Trophy } from 'lucide-react'
import Button from '@/components/Button'

// Shown when nobody is recruiting: a friendly nudge to start a bracket. The
// create CTA opens the same modal as the header button.
const TournamentListEmpty = ({ onCreate }) => {
  return (
    <div className="mt-4 flex w-full flex-col items-center rounded-2xl border-[0.5px] border-white/80 bg-white/50 px-8 py-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fbe3cd] text-[#E86D2F]">
        <Trophy aria-hidden="true" className="h-6 w-6" strokeWidth={2.1} />
      </div>
      <h3 className="mt-5 text-lg font-black text-[#3d1200]">
        No open tournaments
      </h3>
      <p className="mt-2 text-sm leading-6 text-[#9a7050]">
        Nobody is recruiting right now. Start your own bracket and the lobby
        will see it here.
      </p>
      <div className="mt-6">
        <Button fullWidth={false} variant="orange" onClick={onCreate}>
          Create tournament
        </Button>
      </div>
    </div>
  )
}

export default TournamentListEmpty
