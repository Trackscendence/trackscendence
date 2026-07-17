import { Flag, Gamepad2, Trophy } from 'lucide-react'
import StatCard from '@/components/StatCard'

// The account's numbers as the console's stat-card rhythm (#504). Reports
// stay 0 until the P3 Reports section exists.
const UserStatsRow = ({ user }) => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
    <StatCard
      label="Games played"
      value={user.gamesPlayed ?? 0}
      icon={Gamepad2}
    />
    <StatCard label="Wins" value={user.wins ?? 0} icon={Trophy} />
    <StatCard label="Reports" value={user.reportsCount ?? 0} icon={Flag} />
  </div>
)

export default UserStatsRow
