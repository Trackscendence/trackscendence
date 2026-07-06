import { useEffect, useRef, useState } from 'react'
import Input from '@/components/Input'
import useUserSearchStore from '@/stores/useUserSearchStore'
import PlayerSearchResults from './_components/PlayerSearchResults'

// The compact player search at the top of the profile (#220): one input,
// submit on Enter, results in a dropdown. The finder used to live on the
// leaderboard with a heading, label, button, and pagination — here it is
// stripped to a single field and the first page of matches.
const PlayerSearch = () => {
  const results = useUserSearchStore((state) => state.results)
  const isSearching = useUserSearchStore((state) => state.isSearching)
  const error = useUserSearchStore((state) => state.error)
  const hasSearched = useUserSearchStore((state) => state.hasSearched)

  const [term, setTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  // Close the dropdown on an outside click or Escape.
  useEffect(() => {
    if (!isOpen) return undefined
    const handlePointerDown = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // Leaving the profile drops the results so a later visit starts empty.
  useEffect(() => () => useUserSearchStore.getState().clear(), [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const q = term.trim()
    if (!q) {
      useUserSearchStore.getState().clear()
      setIsOpen(false)
      return
    }
    await useUserSearchStore.getState().search({ q, page: 1 })
    setIsOpen(true)
  }

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-md">
      <form onSubmit={handleSubmit}>
        <Input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          onFocus={() => hasSearched && setIsOpen(true)}
          maxLength={50}
          placeholder="Search...."
          aria-label="Search for a player"
        />
      </form>

      {isOpen && hasSearched && !isSearching ? (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-lg border border-[#f0d8bd] bg-white shadow-lg">
          {error ? (
            <p className="px-5 py-4 text-sm font-semibold text-[#8a321f]">
              {error}
            </p>
          ) : (
            <PlayerSearchResults
              results={results}
              onSelect={() => setIsOpen(false)}
            />
          )}
        </div>
      ) : null}
    </div>
  )
}

export default PlayerSearch
