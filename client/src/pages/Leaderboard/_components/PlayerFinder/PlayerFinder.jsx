import { useState } from 'react'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Pagination from '@/components/Pagination'
import useUserSearchStore from '@/stores/useUserSearchStore'
import PlayerSearchResults from './_components/PlayerSearchResults'

const PlayerFinder = () => {
  const results = useUserSearchStore((state) => state.results)
  const pagination = useUserSearchStore((state) => state.pagination)
  const isSearching = useUserSearchStore((state) => state.isSearching)
  const error = useUserSearchStore((state) => state.error)
  const hasSearched = useUserSearchStore((state) => state.hasSearched)

  const [term, setTerm] = useState('')
  // The term the current results belong to. Paging uses this instead of the
  // live input, so editing the box does not change what Previous/Next load.
  const [submittedTerm, setSubmittedTerm] = useState('')

  const runSearch = async (rawTerm, page) => {
    const q = rawTerm.trim()

    if (!q) {
      setSubmittedTerm('')
      useUserSearchStore.getState().clear()
      return
    }

    setSubmittedTerm(q)
    await useUserSearchStore.getState().search({ q, page })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    runSearch(term, 1)
  }

  return (
    <section className="space-y-4 bg-[#ffd099] p-6">
      <h2 className="text-xl font-bold text-[#3d1200]">Find a player</h2>

      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-3 bg-white p-4"
      >
        <label className="flex-1 text-xs font-semibold text-[#7a3810]">
          Username or display name
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            maxLength={50}
            placeholder="Start typing a name"
          />
        </label>
        <Button
          type="submit"
          variant="orange"
          fullWidth={false}
          disabled={isSearching}
        >
          Search
        </Button>
      </form>

      {hasSearched ? (
        error ? (
          <p className="bg-white px-5 py-4 text-sm font-semibold text-[#8a321f]">
            {error}
          </p>
        ) : (
          <>
            <PlayerSearchResults results={results} />
            <Pagination
              pagination={pagination}
              disabled={isSearching}
              onPageChange={(page) => runSearch(submittedTerm, page)}
            />
          </>
        )
      ) : null}
    </section>
  )
}

export default PlayerFinder
