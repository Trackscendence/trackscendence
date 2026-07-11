import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import Input from '@/components/Input'
import useUserSearchStore from '@/stores/useUserSearchStore'
import PlayerSearchResults from './_components/PlayerSearchResults'

// The compact player search (#220): one input, results in a dropdown. It
// searches as you type, debounced so a request only fires once typing pauses
// (the store's monotonic request id drops out-of-order responses); Enter
// searches immediately. Shared by two containers: the profile header, where
// results link to public profiles (the default), and the message compose
// panel, which passes onSelectUser to receive the picked player instead of
// navigating. resultsPlacement flips the dropdown above the input for hosts
// that sit near the bottom of their panel.
const SEARCH_DEBOUNCE_MS = 300

const PlayerSearch = ({
  autoFocus = false,
  className = '',
  inputId,
  onSelectUser = null,
  placeholder = 'Search....',
  resultsPlacement = 'below',
  showIcon = false,
}) => {
  const results = useUserSearchStore((state) => state.results)
  const error = useUserSearchStore((state) => state.error)
  const hasSearched = useUserSearchStore((state) => state.hasSearched)

  const [term, setTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)
  const debounceRef = useRef(null)

  const cancelPendingSearch = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
  }

  // A pending debounce must not outlive the component.
  useEffect(() => cancelPendingSearch, [])

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

  // Unmounting drops the results so the next search starts empty.
  useEffect(() => () => useUserSearchStore.getState().clear(), [])

  const runSearch = async (q) => {
    await useUserSearchStore.getState().search({ q, page: 1 })
    setIsOpen(true)
  }

  const handleChange = (event) => {
    const value = event.target.value
    setTerm(value)
    cancelPendingSearch()

    const q = value.trim()
    if (!q) {
      useUserSearchStore.getState().clear()
      setIsOpen(false)
      return
    }

    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      runSearch(q)
    }, SEARCH_DEBOUNCE_MS)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    cancelPendingSearch()
    const q = term.trim()
    if (!q) {
      useUserSearchStore.getState().clear()
      setIsOpen(false)
      return
    }
    runSearch(q)
  }

  const handlePick = onSelectUser
    ? (user) => {
        setIsOpen(false)
        onSelectUser(user)
      }
    : null

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          {showIcon ? (
            // Input carries mt-2, so the wrapper's center sits 4px above the
            // field's center; the offset keeps the icon centered in the field.
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-[calc(50%+0.25rem)] left-3 h-4 w-4 -translate-y-1/2 text-[#9a7050]"
              strokeWidth={2.2}
            />
          ) : null}
          <Input
            autoFocus={autoFocus}
            className={showIcon ? 'pl-9' : ''}
            id={inputId}
            value={term}
            onChange={handleChange}
            onFocus={() => hasSearched && setIsOpen(true)}
            maxLength={50}
            placeholder={placeholder}
            aria-label="Search for a player"
          />
        </div>
      </form>

      {/* Keep the previous results visible while the next search is in
          flight: hiding on isSearching would flicker on every keystroke. */}
      {isOpen && hasSearched ? (
        <div
          className={`absolute z-30 w-full overflow-hidden rounded-lg border border-[#f0d8bd] bg-white shadow-lg ${
            resultsPlacement === 'above' ? 'bottom-full mb-2' : 'mt-2'
          }`}
        >
          {error ? (
            <p className="px-5 py-4 text-sm font-semibold text-[#8a321f]">
              {error}
            </p>
          ) : (
            <PlayerSearchResults
              results={results}
              onPick={handlePick}
              onSelect={() => setIsOpen(false)}
            />
          )}
        </div>
      ) : null}
    </div>
  )
}

export default PlayerSearch
