import MatchTable from '../MatchTable'

const ProfileGames = ({ matches }) => {
  return (
    <section className="bg-white">
      <div className="border-b border-[#fceee0] px-5 py-3">
        <h2 className="text-sm font-semibold tracking-wide text-[#3d1200] uppercase">
          Game History
        </h2>
      </div>
      <MatchTable matches={matches} />
    </section>
  )
}

export default ProfileGames
