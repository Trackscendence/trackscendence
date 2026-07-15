import { useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import Input from '@/components/Input'
import usePlayerSearch from '@/hooks/usePlayerSearch'
import PlayerSearchResults from './_components/PlayerSearchResults'

// The compact player search (#220): one input, results in a dropdown. It
// searches as you type (debounced, minimum two characters); Enter searches
// immediately. The search lifecycle lives in usePlayerSearch, keyed by the
// scope prop so instances stay isolated. Two containers use it: the profile
// header, where results link to public profiles (the default), and the
// message compose panel, which passes onSelectUser to receive the picked
// player instead of navigating. resultsPlacement flips the dropdown above
// the input for hosts that sit near the bottom of their panel.
const PlayerSearch = ({
  autoFocus = false,
  className = '',
  inputId,
  onSelectUser = null,
  placeholder = 'Search....',
  resultsPlacement = 'below',
  scope,
  showIcon = false,
}) => {
  const {
    changeTerm,
    close,
    error,
    hasSearched,
    isOpen,
    openIfSearched,
    results,
    submitTerm,
    term,
  } = usePlayerSearch(scope)
  const containerRef = useRef(null)

  // Close the dropdown on an outside click or Escape.
  useEffect(() => {
    if (!isOpen) return undefined
    const handlePointerDown = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        close()
      }
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [close, isOpen])

  const handlePick = onSelectUser
    ? (user) => {
        close()
        onSelectUser(user)
      }
    : null

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          submitTerm()
        }}
      >
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
            onChange={(event) => changeTerm(event.target.value)}
            onFocus={openIfSearched}
            maxLength={50}
            placeholder={placeholder}
            aria-label="Search for a player"
          />
        </div>
      </form>

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
              onSelect={close}
            />
          )}
        </div>
      ) : null}
    </div>
  )
}

export default PlayerSearch
