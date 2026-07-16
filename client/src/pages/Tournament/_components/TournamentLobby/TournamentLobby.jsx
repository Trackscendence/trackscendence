import { useState } from 'react'
import Button from '@/components/Button'
import Modal from '@/components/Modal'
import CreateTournamentForm from './_components/CreateTournamentForm'
import TournamentListEmpty from './_components/TournamentListEmpty'
import TournamentListRow from './_components/TournamentListRow'

// Section container for the "no active tournament" state: the list of open
// tournaments plus the create flow. Owns only the create-modal flag; data and
// actions arrive as props from the page container.
const TournamentLobby = ({ isBusy, tournaments, onJoin }) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const openCreate = () => setIsCreateOpen(true)
  const closeCreate = () => setIsCreateOpen(false)

  return (
    <section className="max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-bold text-[#2A1A08]">Open tournaments</h2>
        <Button fullWidth={false} variant="orange" onClick={openCreate}>
          Create tournament
        </Button>
      </div>

      {tournaments.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {tournaments.map((tournament) => (
            <TournamentListRow
              key={tournament.id}
              isBusy={isBusy}
              name={tournament.name}
              playerCount={tournament.playerCount}
              prizePoints={tournament.prizePoints}
              size={tournament.size}
              onJoin={() => onJoin(tournament.id)}
            />
          ))}
        </ul>
      ) : (
        <TournamentListEmpty onCreate={openCreate} />
      )}

      <Modal
        isOpen={isCreateOpen}
        title="Create tournament"
        onClose={closeCreate}
      >
        <CreateTournamentForm onSuccess={closeCreate} />
      </Modal>
    </section>
  )
}

export default TournamentLobby
