import { useState } from 'react'

const usePagination = ({ initialPage = 1, pageSize = 10 } = {}) => {
  const [page, setPage] = useState(initialPage)

  return {
    page,
    pageSize,
    setPage,
    nextPage: () => setPage((p) => p + 1),
    prevPage: () => setPage((p) => Math.max(1, p - 1)),
    reset: () => setPage(initialPage),
  }
}

export default usePagination
