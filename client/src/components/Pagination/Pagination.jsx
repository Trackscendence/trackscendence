import Button from '@/components/Button'

// Shared pagination controls. A presenter: it renders whatever paging state
// it is given (`{ page, limit, totalCount }`) and reports clicks upward.
const Pagination = ({ pagination, onPageChange, disabled = false }) => {
  if (!pagination) return null

  const { page, limit, totalCount } = pagination
  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / (limit || 1)))

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between gap-3">
      <Button
        variant="orangeOutline"
        fullWidth={false}
        disabled={disabled || page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </Button>
      <span className="text-sm font-semibold text-[#7a3810]">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="orangeOutline"
        fullWidth={false}
        disabled={disabled || page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </div>
  )
}

export default Pagination
