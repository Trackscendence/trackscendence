import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import useGameStore from '@/stores/useGameStore'
import useLogoStore from '@/stores/useLogoStore'
import useDevStore, { selectIsRigged } from './useDevStore'
import ToggleSwitch from './controls/ToggleSwitch'
import RadioGroup from './controls/RadioGroup'
import useGameSimulation from './sim/useGameSimulation'
import { DEV_GAME_ID } from './constants'

// The waiting room lives at these paths; the mock opponent only applies there.
const WAITING_ROOM_PATHS = new Set(['/', '/lobby'])

const FILL_OPTIONS = [
  { value: 'uno', label: 'uno' },
  { value: 'skip', label: 'skip' },
  { value: 'bot', label: 'bot' },
]

const SOURCE_OPTIONS = [
  { value: 'live', label: 'Live backend' },
  { value: 'mocked', label: 'Mocked' },
]

const SIM_PLAYER_OPTIONS = [
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
]

const SIM_SPEED_OPTIONS = [
  { value: 'slow', label: 'slow' },
  { value: 'normal', label: 'normal' },
  { value: 'fast', label: 'fast' },
]

// The result the "Skip to outcome" jump lands on. 'won' fires confetti, 'lost'
// is the calm "Try Again", 'ended' is the neutral abandoned state.
const OUTCOME_OPTIONS = [
  { value: 'won', label: 'won' },
  { value: 'lost', label: 'lost' },
  { value: 'end', label: 'ended' },
]

// Preview the candidate UNO logos in the lobby nav. 'text' is the shipping
// lettered badge; 'png' is the raster art; 'svg' is the traced vector (kept so
// its poor rendering is visible next to the others).
const LOGO_OPTIONS = [
  { value: 'text', label: 'text' },
  { value: 'png', label: 'png' },
  { value: 'svg', label: 'svg' },
]

// Injects / withdraws a fake opponent so matchmaking advances without a second
// real player. All of this is confined to the dev module — Lobby.jsx reacts to
// the injected match exactly as it would to a real `game_start` socket event.
const useMockOpponent = () => {
  const { pathname } = useLocation()
  const mockOpponent = useDevStore((state) => state.mockOpponent)
  const fillWith = useDevStore((state) => state.fillWith)
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    if (!mockOpponent || !user || !WAITING_ROOM_PATHS.has(pathname))
      return undefined

    const { match, setMatch } = useGameStore.getState()
    // Don't clobber a real match that may have arrived over the socket.
    if (match && match.gameId !== DEV_GAME_ID) return undefined

    setMatch({
      gameId: DEV_GAME_ID,
      players: [
        { userId: user.id, username: user.username },
        { userId: 'dev-bot', username: fillWith },
      ],
    })

    return () => {
      // Withdraw only our own fake, so a genuine match is left alone.
      const current = useGameStore.getState().match
      if (current?.gameId === DEV_GAME_ID)
        useGameStore.getState().setMatch(null)
    }
  }, [mockOpponent, fillWith, user, pathname])
}

const StatusLed = ({ rigged }) => (
  <span
    aria-hidden
    className={[
      'inline-block h-2 w-2 rounded-full',
      rigged ? 'bg-[#FFB04F]' : 'bg-[#B39B7C]/50',
    ].join(' ')}
  />
)

const DevControls = () => {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  // 'collapsed' = launcher tab, 'expanded' = full panel, 'hidden' = gone.
  const [view, setView] = useState('collapsed')
  const rigged = useDevStore(selectIsRigged)
  const mockOpponent = useDevStore((state) => state.mockOpponent)
  const fillWith = useDevStore((state) => state.fillWith)
  const dataSource = useDevStore((state) => state.dataSource)
  const outcomeState = useDevStore((state) => state.outcomeState)
  const simulateGame = useDevStore((state) => state.simulateGame)
  const simSpeed = useDevStore((state) => state.simSpeed)
  const simPlayers = useDevStore((state) => state.simPlayers)
  const setFlag = useDevStore((state) => state.setFlag)
  const restartSim = useDevStore((state) => state.restartSim)
  const reset = useDevStore((state) => state.reset)
  const logoVariant = useLogoStore((state) => state.variant)
  const setLogoVariant = useLogoStore((state) => state.setVariant)

  // The simulated game's winner, for the status line under the sim controls.
  const simWinnerId = useGameStore((state) =>
    state.gameState?.gameId === DEV_GAME_ID ? state.gameState.winner : null,
  )
  const simWinnerName = useGameStore(
    (state) =>
      state.gamePlayers.find((player) => player.userId === simWinnerId)
        ?.username,
  )

  useMockOpponent()
  useGameSimulation()

  // The results screen reads its mode from the URL, not the dev store. When
  // the radio changes while already on /results, swap the query param in place
  // so the pick applies immediately — no second "Skip to outcome" click needed.
  const handleOutcomeChange = (next) => {
    setFlag('outcomeState', next)
    if (pathname === '/results') {
      navigate(`/results?outcome=${next}`, { replace: true })
    }
  }

  // Same URL-driven pattern for the game table: it renders its designable
  // mock only when dev builds see ?source=mock, so flipping the data source
  // while on /game swaps that param in place (other params are preserved —
  // they shape the mock).
  const handleDataSourceChange = (next) => {
    setFlag('dataSource', next)
    if (pathname !== '/game') return
    const params = new URLSearchParams(search)
    if (next === 'mocked') {
      params.set('source', 'mock')
    } else {
      params.delete('source')
    }
    const query = params.toString()
    navigate(query ? `/game?${query}` : '/game', { replace: true })
  }

  // The sim lives on the game table, on the live-data render path; jump
  // there when it switches on, shedding any ?source=mock left in the URL
  // (the static mock would win over the store otherwise).
  const handleSimulateChange = (next) => {
    setFlag('simulateGame', next)
    if (!next) return
    const params = new URLSearchParams(search)
    if (pathname !== '/game' || params.get('source') === 'mock')
      navigate('/game')
  }

  // Ctrl+` fully hides / re-summons the panel when it's in your way.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.ctrlKey && event.key === '`') {
        event.preventDefault()
        setView((current) => (current === 'hidden' ? 'collapsed' : 'hidden'))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  if (view === 'hidden') return null

  if (view === 'collapsed') {
    return (
      <button
        type="button"
        onClick={() => setView('expanded')}
        className="fixed right-4 bottom-4 z-[9999] flex items-center gap-2 rounded-lg rounded-br-sm bg-[#1C120A] px-3 py-2 font-sans text-[11px] font-bold tracking-[0.15em] text-[#FDE8CF] uppercase shadow-lg transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB04F]"
      >
        <StatusLed rigged={rigged} />
        Controls
      </button>
    )
  }

  return (
    <div className="motion-safe:animate-dev-deal fixed right-4 bottom-4 z-[9999] w-80 overflow-hidden rounded-lg bg-[#1C120A] text-[#FDE8CF] shadow-2xl ring-1 ring-[#FDE8CF]/10">
      <header className="flex items-center justify-between border-b border-[#FDE8CF]/10 px-4 py-3">
        <div className="flex flex-col">
          <span className="font-sans text-[13px] font-bold tracking-[0.15em] uppercase">
            Controls
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] text-[#B39B7C]">
            <StatusLed rigged={rigged} />
            {rigged ? 'mocks active' : 'all live'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Collapse panel"
            title="Collapse"
            onClick={() => setView('collapsed')}
            className="grid h-7 w-7 place-items-center rounded-md text-[#B39B7C] hover:bg-[#2B1E12] hover:text-[#FDE8CF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB04F]"
          >
            —
          </button>
          <button
            type="button"
            aria-label="Hide panel (Ctrl+`)"
            title="Hide — reopen with Ctrl+`"
            onClick={() => setView('hidden')}
            className="grid h-7 w-7 place-items-center rounded-md text-[#B39B7C] hover:bg-[#2B1E12] hover:text-[#FDE8CF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB04F]"
          >
            ✕
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-4 px-4 py-4">
        <section className="flex flex-col gap-3">
          <h3 className="font-mono text-[11px] tracking-wider text-[#B39B7C] uppercase">
            Matchmaking
          </h3>
          <ToggleSwitch
            label="Mock opponent"
            hint="Auto-fills a fake player so you can advance solo"
            checked={mockOpponent}
            onChange={(next) => setFlag('mockOpponent', next)}
          />
          <RadioGroup
            label="Fill with"
            name="dev-fill-with"
            value={fillWith}
            options={FILL_OPTIONS}
            onChange={(next) => setFlag('fillWith', next)}
          />
        </section>

        <div className="border-t border-[#FDE8CF]/10" />

        <section className="flex flex-col gap-3">
          <RadioGroup
            label="Data source"
            name="dev-data-source"
            value={dataSource}
            options={SOURCE_OPTIONS}
            variant="dotted"
            onChange={handleDataSourceChange}
          />
        </section>

        <div className="border-t border-[#FDE8CF]/10" />

        <section className="flex flex-col gap-3">
          <h3 className="font-mono text-[11px] tracking-wider text-[#B39B7C] uppercase">
            Simulation
          </h3>
          <ToggleSwitch
            label="Simulate game"
            hint="Bots play a full game on the table — no players needed"
            checked={simulateGame}
            onChange={handleSimulateChange}
          />
          {simulateGame ? (
            <>
              <RadioGroup
                label="Players"
                name="dev-sim-players"
                value={simPlayers}
                options={SIM_PLAYER_OPTIONS}
                onChange={(next) => setFlag('simPlayers', next)}
              />
              <RadioGroup
                label="Speed"
                name="dev-sim-speed"
                value={simSpeed}
                options={SIM_SPEED_OPTIONS}
                onChange={(next) => setFlag('simSpeed', next)}
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={restartSim}
                  className="self-start rounded-md bg-[#FFB04F] px-3 py-1.5 font-mono text-[12px] font-bold text-[#1C120A] transition-colors hover:bg-[#ffc275] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB04F]"
                >
                  Restart ↻
                </button>
                <span className="font-mono text-[11px] text-[#B39B7C]">
                  {simWinnerName
                    ? `${simWinnerName} wins`
                    : 'bots at the table…'}
                </span>
              </div>
            </>
          ) : null}
        </section>

        <div className="border-t border-[#FDE8CF]/10" />

        <section className="flex flex-col gap-3">
          <h3 className="font-mono text-[11px] tracking-wider text-[#B39B7C] uppercase">
            Post-game
          </h3>
          <RadioGroup
            label="Outcome"
            name="dev-outcome"
            value={outcomeState}
            options={OUTCOME_OPTIONS}
            onChange={handleOutcomeChange}
          />
          <button
            type="button"
            onClick={() => navigate(`/results?outcome=${outcomeState}`)}
            className="self-start rounded-md bg-[#FFB04F] px-3 py-1.5 font-mono text-[12px] font-bold text-[#1C120A] transition-colors hover:bg-[#ffc275] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB04F]"
          >
            Skip to outcome →
          </button>
        </section>

        <div className="border-t border-[#FDE8CF]/10" />

        <section className="flex flex-col gap-3">
          <h3 className="font-mono text-[11px] tracking-wider text-[#B39B7C] uppercase">
            Appearance
          </h3>
          <RadioGroup
            label="Logo"
            name="dev-logo"
            value={logoVariant}
            options={LOGO_OPTIONS}
            onChange={setLogoVariant}
          />
        </section>

        <div className="border-t border-[#FDE8CF]/10" />

        <button
          type="button"
          onClick={() => {
            reset()
            setLogoVariant('text')
          }}
          className="self-start font-mono text-[12px] text-[#E03325] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB04F]"
        >
          Reset to live
        </button>
      </div>
    </div>
  )
}

export default DevControls
