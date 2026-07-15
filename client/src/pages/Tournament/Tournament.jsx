import useTournamentStore from '@/stores/useTournamentStore'
import buildBracketView from './buildBracketView'
import TournamentView from './_components/TournamentView'

// Container for /tournament (#444). The server has no tournament module yet,
// so the store's activeTournament stays null and the view falls back to its
// coming-soon state; no requests fire from here. The backend epic fills the
// store and the bracket lights up without touching this page.
const Tournament = () => {
  const activeTournament = useTournamentStore((state) => state.activeTournament)

  return <TournamentView bracket={buildBracketView(activeTournament)} />
}

export default Tournament
