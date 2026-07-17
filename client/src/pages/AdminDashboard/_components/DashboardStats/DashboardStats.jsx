import { DoorOpen, Gamepad2, Trophy, Users } from 'lucide-react'
import StatCard from '@/components/StatCard'

// The stat-card row (#501): mobile-first, one column, then two, then four.
// "Games in progress" is the in-memory game store's number and resets with
// the server process — worth saying on the card, not hiding (spec §3.5).
const DashboardStats = ({ stats }) => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
    <StatCard label="Total players" value={stats.totalPlayers} icon={Users} />
    <StatCard
      label="Games in progress"
      value={stats.activeGames}
      icon={Gamepad2}
      hint="Live right now"
    />
    <StatCard label="Open rooms" value={stats.openRooms} icon={DoorOpen} />
    <StatCard label="Games today" value={stats.gamesToday} icon={Trophy} />
  </div>
)

export default DashboardStats
