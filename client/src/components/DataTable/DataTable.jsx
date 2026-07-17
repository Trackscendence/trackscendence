import LoadingSpinner from '@/components/LoadingSpinner'

// The Administration console's table shell (Players now, Rooms/Reports at
// P2/P3). A presenter: columns describe the desktop table, `renderCard` (when
// given) renders each row as a stacked card below `sm` — the mobile rule is
// cards, never a sideways-scrolling table. Loading, error, and empty are
// explicit states, so callers never overlay their own.
//
// columns: [{ key, header, className?, render?(row) }] — `render` falls back
// to reading `row[key]`. `rowKey(row)` must return a stable identity.
const DataTable = ({
  columns,
  rows,
  rowKey,
  renderCard,
  isLoading = false,
  error = '',
  emptyMessage = 'Nothing to show yet.',
}) => {
  if (isLoading) {
    return (
      <div className="bg-admin-surface rounded-2xl p-8 shadow-sm">
        <LoadingSpinner message="Loading" />
      </div>
    )
  }

  if (error) {
    return (
      <p
        role="alert"
        className="bg-status-banned/10 text-status-banned rounded-2xl px-4 py-3 text-sm font-semibold"
      >
        {error}
      </p>
    )
  }

  if (!rows.length) {
    return (
      <p className="bg-admin-surface text-admin-muted rounded-2xl px-4 py-8 text-center text-sm font-semibold shadow-sm">
        {emptyMessage}
      </p>
    )
  }

  return (
    <>
      {renderCard ? (
        <ul className="space-y-3 sm:hidden">
          {rows.map((row) => (
            <li
              key={rowKey(row)}
              className="bg-admin-surface rounded-2xl p-4 shadow-sm"
            >
              {renderCard(row)}
            </li>
          ))}
        </ul>
      ) : null}
      <div
        className={`bg-admin-surface overflow-x-auto rounded-2xl shadow-sm ${
          renderCard ? 'hidden sm:block' : ''
        }`}
      >
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-admin-ink/10 border-b">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`text-admin-muted px-4 py-3 text-xs font-bold tracking-[0.08em] uppercase ${column.className || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className="border-admin-ink/5 text-admin-ink border-b last:border-b-0"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3 ${column.className || ''}`}
                  >
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default DataTable
