import { useCallback, useEffect, useRef, useState } from 'react'
import useDebounce from '@/hooks/useDebounce'
import useUserSearchStore from '@/stores/useUserSearchStore'
import { createPlayerSearchRunGate } from './playerSearchRunGate'

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
  if (!scope) {
    throw new Error('usePlayerSearch requires a stable scope')
  }

  const scopeState =
    useUserSearchStore((state) => state.scopes[scope]) || EMPTY_SCOPE_STATE

  const [term, setTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [runGate] = useState(createPlayerSearchRunGate)
  const debouncedTerm = useDebounce(term)
  const isMountedRef = useRef(false)
  const skipNextDebouncedQueryRef = useRef(null)
  const termRef = useRef('')

  const searchAndOpen = useCallback(
    async (searchQuery, runId) => {
      try {
        const didCommit = await useUserSearchStore
          .getState()
          .search(scope, { query: searchQuery, page: 1 })

        if (!didCommit) return
        if (!isMountedRef.current) return
        if (!runGate.isCurrentRun(runId)) return
        if (termRef.current.trim() !== searchQuery) return
        setIsOpen(true)
      } catch {
        // The store owns user-facing search errors. This guard prevents an
        // unexpected failure from becoming an unhandled event-handler promise.
      }
    },
    [runGate, scope],
  )

  // Fires once typing pauses. The cleanup supersedes this run so a response
  // that lands after a newer term (or after unmount) cannot open the list.
  useEffect(() => {
    const searchQuery = debouncedTerm.trim()
    if (searchQuery.length < MIN_SEARCH_LENGTH) return undefined
    if (termRef.current.trim() !== searchQuery) return undefined

    if (skipNextDebouncedQueryRef.current === searchQuery) {
      skipNextDebouncedQueryRef.current = null
      return undefined
    }

    const runId = runGate.beginRun()
    searchAndOpen(searchQuery, runId)

    return () => {
      runGate.supersedeRun(runId)
    }
  }, [debouncedTerm, runGate, searchAndOpen])

  // The scope's results do not outlive the component; clear() also
  // invalidates whatever request is still in flight for it.
  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
      runGate.invalidateRun()
      useUserSearchStore.getState().clear(scope)
    }
  }, [runGate, scope])

  const changeTerm = (value) => {
    setTerm(value)
    termRef.current = value
    runGate.invalidateRun()
    const searchQuery = value.trim()
    if (
      skipNextDebouncedQueryRef.current &&
      skipNextDebouncedQueryRef.current !== searchQuery
    ) {
      skipNextDebouncedQueryRef.current = null
    }

    if (searchQuery.length < MIN_SEARCH_LENGTH) {
      useUserSearchStore.getState().clear(scope)
      setIsOpen(false)
    } else {
      useUserSearchStore.getState().invalidate(scope)
    }
  }

  // Enter skips the debounce for an immediate search.
  const submitTerm = () => {
    const searchQuery = termRef.current.trim()
    if (searchQuery.length < MIN_SEARCH_LENGTH) {
      useUserSearchStore.getState().clear(scope)
      setIsOpen(false)
      return
    }

    skipNextDebouncedQueryRef.current =
      debouncedTerm.trim() === searchQuery ? null : searchQuery
    const runId = runGate.beginRun()
    searchAndOpen(searchQuery, runId)
  }

  const close = useCallback(() => {
    runGate.invalidateRun()
    setIsOpen(false)
  }, [runGate])

  return {
    changeTerm,
    close,
    error: scopeState.error,
    hasSearched: scopeState.hasSearched,
    isOpen,
    openIfSearched: () => {
      if (
        scopeState.hasSearched &&
        termRef.current.trim().length >= MIN_SEARCH_LENGTH
      ) {
        setIsOpen(true)
      }
    },
    results: scopeState.results,
    submitTerm,
    term,
  }
}

export default usePlayerSearch
