import { useEffect, useState } from 'react'
import useAuthStore from '@/stores/useAuthStore'
import useGameStore from '@/stores/useGameStore'
import useSocketStore from '@/stores/useSocketStore'
import { checkApiHealth } from '@/services/system'
import useDiagnosticsStore, { initDiagnostics } from '@/dev/diagnostics'
import HudRow from './HudRow'
import ErrorList from './ErrorList'

const HEALTH_POLL_MS = 5000

// Container: the live debug HUD. Reads system state from the stores and polls
// the API so a broken connection, dropped socket, or failed request is visible
// at a glance instead of hiding behind a spinner. Dev-only — the whole module
// is imported behind import.meta.env.DEV.
const DevHud = () => {
  // 'collapsed' = launcher tab, 'expanded' = full panel, 'hidden' = gone.
  const [view, setView] = useState('collapsed')
  const [health, setHealth] = useState({ tone: 'idle', text: 'checking…' })

  const isConnected = useSocketStore((state) => state.isConnected)
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const rooms = useGameStore((state) => state.rooms)
  const lobbyCount = useGameStore((state) => state.lobbyCount)
  const match = useGameStore((state) => state.match)
  const gameState = useGameStore((state) => state.gameState)
  const events = useDiagnosticsStore((state) => state.events)
  const clearEvents = useDiagnosticsStore((state) => state.clear)

  // Capture uncaught errors, rejections, and failed requests for the lifetime
  // of the HUD. Init is idempotent and lives here (not in App) so the whole
  // diagnostics module stays inside the dev-only bundle.
  useEffect(() => initDiagnostics(), [])

  // Poll health on an interval; measure round-trip latency so a slow API reads
  // differently from a healthy one.
  useEffect(() => {
    let isCancelled = false

    const probe = async () => {
      const startedAt = performance.now()
      try {
        await checkApiHealth()
        if (isCancelled) return
        const ms = Math.round(performance.now() - startedAt)
        setHealth({ tone: ms > 500 ? 'warn' : 'ok', text: `${ms}ms` })
      } catch {
        if (!isCancelled) setHealth({ tone: 'down', text: 'down' })
      }
    }

    probe()
    const timer = setInterval(probe, HEALTH_POLL_MS)
    return () => {
      isCancelled = true
      clearInterval(timer)
    }
  }, [])

  // Ctrl+I fully hides / re-summons the HUD when it's in the way.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.ctrlKey && (event.key === 'i' || event.key === 'I')) {
        event.preventDefault()
        setView((current) => (current === 'hidden' ? 'collapsed' : 'hidden'))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  if (view === 'hidden') return null

  const errorTone = events.some((event) => event.kind !== 'request')
    ? 'down'
    : events.length > 0
      ? 'warn'
      : 'idle'
  // Worst-of the live signals drives the launcher dot, so a collapsed HUD still
  // flags trouble.
  const overallTone =
    health.tone === 'down' || errorTone === 'down'
      ? 'down'
      : health.tone === 'warn' || !isConnected || errorTone === 'warn'
        ? 'warn'
        : 'ok'

  if (view === 'collapsed') {
    return (
      <button
        type="button"
        onClick={() => setView('expanded')}
        className="fixed bottom-4 left-4 z-[9999] flex items-center gap-2 rounded-lg rounded-bl-sm bg-[#1C120A] px-3 py-2 font-sans text-[11px] font-bold tracking-[0.15em] text-[#FDE8CF] uppercase shadow-lg transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB04F]"
      >
        <span
          aria-hidden
          className={[
            'inline-block h-2 w-2 rounded-full',
            overallTone === 'down'
              ? 'bg-[#E03325]'
              : overallTone === 'warn'
                ? 'bg-[#FFB04F]'
                : 'bg-[#5FBF77]',
          ].join(' ')}
        />
        Debug
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 z-[9999] w-72 overflow-hidden rounded-lg bg-[#1C120A] text-[#FDE8CF] shadow-2xl ring-1 ring-[#FDE8CF]/10">
      <header className="flex items-center justify-between border-b border-[#FDE8CF]/10 px-4 py-3">
        <span className="font-sans text-[13px] font-bold tracking-[0.15em] uppercase">
          Debug
        </span>
        <button
          type="button"
          aria-label="Collapse HUD"
          title="Collapse"
          onClick={() => setView('collapsed')}
          className="grid h-7 w-7 place-items-center rounded-md text-[#B39B7C] hover:bg-[#2B1E12] hover:text-[#FDE8CF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB04F]"
        >
          —
        </button>
      </header>

      <div className="flex flex-col gap-2.5 px-4 py-4">
        <HudRow label="API" value={health.text} tone={health.tone} />
        <HudRow
          label="Socket"
          value={isConnected ? 'connected' : 'offline'}
          tone={isConnected ? 'ok' : 'warn'}
        />
        <HudRow
          label="Auth"
          value={
            isAuthenticated && user
              ? `${user.username} (${user.role || 'USER'})`
              : 'signed out'
          }
          tone={isAuthenticated ? 'ok' : 'idle'}
        />
        <HudRow
          label="Rooms"
          value={`${rooms.length} rooms · ${lobbyCount} in lobby`}
          tone="idle"
        />
        <HudRow
          label="Game"
          value={
            gameState?.gameId
              ? `#${gameState.gameId} · turn ${gameState.currentPlayer ?? '—'}`
              : match?.gameId
                ? 'matched'
                : 'none'
          }
          tone={gameState?.gameId ? 'ok' : 'idle'}
        />

        <div className="border-t border-[#FDE8CF]/10" />

        <ErrorList events={events} onClear={clearEvents} />
      </div>
    </div>
  )
}

export default DevHud
