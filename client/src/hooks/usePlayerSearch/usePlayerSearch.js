import { useCallback, useEffect, useRef, useState } from 'react'
import useDebounce from '@/hooks/useDebounce'
import useUserSearchStore from '@/stores/useUserSearchStore'

// Queries shorter than this never reach the API: single characters match a
// large slice of the user table for no navigational value.
const MIN_SEARCH_LENGTH = 2

const EMPTY_SCOPE_STATE = {
  results: [],
  error: null,
  hasSearched: false,
}

// The search lifecycle behind one PlayerSearch instance: the term, the
// debounced live search, and the dropdown's open state. All store traffic is
// keyed by the caller's scope, so instances stay isolated from each other.
// Debounce is only pacing, not a correctness boundary; the guards are that a
// cleared or unmounted scope invalidates its in-flight request in the store,
// and that a response may only open the dropdown while its query still
// matches the input.
const usePlayerSearch = (scope) => {
  const scopeState =
    useUserSearchStore((state) => state.scopes[scope]) || EMPTY_SCOPE_STATE

  const [term, setTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const debouncedTerm = useDebounce(term)
  const termRef = useRef('')

  // Fires once typing pauses. The cleanup marks the run stale so a response
  // that lands after a newer term (or after unmount) cannot open the list.
  useEffect(() => {
    const q = debouncedTerm.trim()
    if (q.length < MIN_SEARCH_LENGTH) return undefined

    let isStale = false

    const search = async () => {
      await useUserSearchStore.getState().search(scope, { q, page: 1 })
      if (isStale) return
      if (termRef.current.trim() !== q) return
      setIsOpen(true)
    }
    search()

    return () => {
      isStale = true
    }
  }, [debouncedTerm, scope])

  // The scope's results do not outlive the component; clear() also
  // invalidates whatever request is still in flight for it.
  useEffect(() => () => useUserSearchStore.getState().clear(scope), [scope])

  const changeTerm = (value) => {
    setTerm(value)
    termRef.current = value
    if (value.trim().length < MIN_SEARCH_LENGTH) {
      useUserSearchStore.getState().clear(scope)
      setIsOpen(false)
    }
  }

  // Enter skips the debounce for an immediate search.
  const submitTerm = () => {
    const q = termRef.current.trim()
    if (q.length < MIN_SEARCH_LENGTH) {
      useUserSearchStore.getState().clear(scope)
      setIsOpen(false)
      return
    }

    const search = async () => {
      await useUserSearchStore.getState().search(scope, { q, page: 1 })
      if (termRef.current.trim() !== q) return
      setIsOpen(true)
    }
    search()
  }

  const close = useCallback(() => setIsOpen(false), [])

  return {
    changeTerm,
    close,
    error: scopeState.error,
    hasSearched: scopeState.hasSearched,
    isOpen,
    openIfSearched: () => {
      if (scopeState.hasSearched) setIsOpen(true)
    },
    results: scopeState.results,
    submitTerm,
    term,
  }
}

export default usePlayerSearch
