import ProfileLink from '@/components/ProfileLink'
import EmptyState from '../EmptyState'
import profileFormatters from '../../_utils/profileFormatters'

const RESULT_STYLES = {
  ABANDONED: 'bg-[#f1f3f0] text-[#617267]',
  LOSS: 'bg-[#fee2e2] text-[#b91c1c]',
  WIN: 'bg-[#dcfce7] text-[#15803d]',
}

const MatchTable = ({ matches }) => {
  if (!matches || matches.length === 0) {
    return (
      <EmptyState title="No games yet">
        Completed matches will appear here once this player has results.
      </EmptyState>
    )
  }

  return (
    <div className="overflow-x-auto bg-white">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-[#fceee0]">
            {['Opponent', 'Result', 'Score', 'Duration', 'Date'].map(
              (heading) => (
                <th
                  key={heading}
                  className="px-5 py-2.5 text-left text-[10px] font-semibold tracking-wide text-[#7a3810] uppercase"
                >
                  {heading}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {matches.map((match) => (
            <tr
              key={match.gameId}
              className="border-b border-[#fceee0] last:border-b-0 hover:bg-[#fff8f2]"
            >
              <td className="px-5 py-3 text-sm font-semibold text-[#3d1200]">
                {match.opponents?.length === 1 ? (
                  <ProfileLink
                    className="hover:text-[#e86d2f]"
                    username={match.opponents[0].username}
                  >
                    {profileFormatters.formatOpponents(match.opponents)}
                  </ProfileLink>
                ) : (
                  profileFormatters.formatOpponents(match.opponents)
                )}
              </td>
              <td className="px-5 py-3">
                <span
                  className={`rounded-sm px-2.5 py-0.5 text-[11px] font-bold ${
                    RESULT_STYLES[match.result] || RESULT_STYLES.ABANDONED
                  }`}
                >
                  {match.result}
                </span>
              </td>
              <td className="px-5 py-3 text-sm text-[#7a3810]">
                {match.score}
              </td>
              <td className="px-5 py-3 text-sm text-[#7a3810]">
                {profileFormatters.formatDuration(match)}
              </td>
              <td className="px-5 py-3 text-xs text-[#7a3810]">
                {profileFormatters.formatDate(match.endedAt || match.startedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default MatchTable
