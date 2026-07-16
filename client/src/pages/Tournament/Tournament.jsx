import { useEffect } from 'react'
import Spinner from '@/components/Spinner'
import useAuthStore from '@/stores/useAuthStore'
import useTournamentStore from '@/stores/useTournamentStore'
import buildBracketView from './buildBracketView'
import ChampionCallout from './_components/ChampionCallout'
import TournamentBracket from './_components/TournamentBracket'
import TournamentLobby from './_components/TournamentLobby'
import TournamentView from './_components/TournamentView'
import TournamentWaitingCard from './_components/TournamentWaitingCard'

// Container for /tournament (#458). Everything renders from store state: no
// active tournament shows the open list with create/join, a joined OPEN
// tournament shows the waiting card, RUNNING shows the bracket, and COMPLETED
// adds the champion callout above it. Refreshes are static — actions refetch
// the list; live socket updates ship separately.
const Tournament = () => {
  const activeTournament = useTournamentStore((state) => state.activeTournament)
  const tournaments = useTournamentStore((state) => state.tournaments)
  const isLoading = useTournamentStore((state) => state.isLoading)
  const error = useTournamentStore((state) => state.error)
  const userId = useAuthStore((state) => state.user?.id)

  useEffect(() => {
    // Fire-and-forget on purpose: the actions catch their own errors into
    // store state, and their request-id and session guards make writes after
    // an unmount or logout harmless, so no cleanup flag is needed here.
    const { loadActiveTournament, loadTournaments } =
      useTournamentStore.getState()
    loadActiveTournament()
    loadTournaments()
  }, [])

  const handleJoin = async (tournamentId) => {
    const { joinTournament, loadTournaments } = useTournamentStore.getState()
    await joinTournament(tournamentId)
    await loadTournaments()
  }

  const handleLeave = async () => {
    const { leaveTournament, loadTournaments } = useTournamentStore.getState()
    await leaveTournament()
    await loadTournaments()
  }

  const renderContent = () => {
    if (isLoading && !activeTournament && tournaments.length === 0) {
      return <Spinner className="text-[#9A7050]" size={28} />
    }
    if (!activeTournament) {
      return (
        <TournamentLobby
          isBusy={isLoading}
          tournaments={tournaments}
          onJoin={handleJoin}
        />
      )
    }
    if (activeTournament.status === 'OPEN') {
      return (
        <TournamentWaitingCard
          isBusy={isLoading}
          isCreator={activeTournament.createdById === userId}
          name={activeTournament.name}
          playerCount={activeTournament.playerCount}
          prizePoints={activeTournament.prizePoints}
          size={activeTournament.size}
          onLeave={handleLeave}
        />
      )
    }

    const bracket = buildBracketView(activeTournament)
    return (
      <>
        {activeTournament.status === 'COMPLETED' && bracket.champion ? (
          <ChampionCallout
            name={bracket.champion.name}
            prizePoints={bracket.prizePoints}
          />
        ) : null}
        <TournamentBracket bracket={bracket} />
      </>
    )
  }

  return <TournamentView error={error}>{renderContent()}</TournamentView>
}

export default Tournament
