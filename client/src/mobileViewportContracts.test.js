import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const assertSourceContains = (relativePath, snippets) => {
  const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8')

  for (const snippet of snippets) {
    assert.ok(source.includes(snippet), `${relativePath} is missing ${snippet}`)
  }
}

test('mobile route shells keep their responsive contracts', () => {
  const contracts = [
    // The shell owns the full-height flex column that every signed-in page
    // sits inside now.
    ['./layouts/Layout/Layout.jsx', ['min-h-[100dvh]', 'flex-col']],
    [
      // Desktop actions hide on phones; MobileMenu replaces them there.
      './layouts/Layout/_components/Header/Header.jsx',
      ['hidden', 'sm:flex', 'MobileMenu'],
    ],
    [
      './layouts/Layout/_components/Header/_components/MobileMenu/MobileMenu.jsx',
      ['sm:hidden'],
    ],
    [
      './layouts/Authentication/Authentication.jsx',
      ['min-h-[100dvh]', 'flex-col'],
    ],
    [
      // Back/Lobby share the top row; the search wraps to its own line.
      './layouts/Account/Account.jsx',
      ['min-h-[100dvh]', 'flex-wrap', 'sm:flex-nowrap'],
    ],
    [
      './pages/Lobby/_components/LobbyView/LobbyView.jsx',
      ['flex-1', 'flex-col'],
    ],
    ['./pages/AdminAccess/AdminAccess.jsx', ['grid gap-6', 'lg:grid-cols']],
    [
      './pages/WaitingRoom/_components/WaitingRoomView/WaitingRoomView.jsx',
      ['flex-1', 'flex-col', 'overflow-hidden'],
    ],
    [
      './pages/Messages/Messages.jsx',
      ['grid-cols-1', 'lg:grid-cols-[360px_minmax(0,1fr)]'],
    ],
    [
      // Portrait swaps the scaled desktop slots for the chip band and keeps
      // the hand reachable through its own horizontal scroll.
      './pages/Game/_components/GameTable/GameTable.jsx',
      ['grid-cols-1', 'overflow-x-hidden', 'MobileOpponentChip', 'md:hidden'],
    ],
    [
      './pages/Game/_components/PlayerHand/PlayerHand.jsx',
      ['overflow-x-auto', 'w-max min-w-full'],
    ],
    [
      './pages/SettingsPage/SettingsPage.jsx',
      ['min-h-[100dvh]', 'flex-col', 'sm:flex-row'],
    ],
    [
      './pages/SettingsPage/_components/AccountSettings/_components/AvatarUploader/AvatarUploader.jsx',
      ['flex-col', 'sm:flex-row', 'w-full rounded-xl'],
    ],
    [
      './pages/SettingsPage/_components/AccountSettings/_components/GuestUpgradeForm/GuestUpgradeForm.jsx',
      ['className="w-full sm:w-auto"', 'Save progress'],
    ],
    [
      './pages/SettingsPage/_components/DeleteAccountSettings/DeleteAccountSettings.jsx',
      ['w-full rounded-xl bg-[#b93820]', 'sm:w-auto'],
    ],
    [
      './components/LoadingSpinner/LoadingSpinner.jsx',
      ['min-h-[100dvh]', 'break-words'],
    ],
    [
      './components/Modal/Modal.jsx',
      ['max-h-[min(80vh,calc(100dvh-1.5rem))]', 'overflow-y-auto'],
    ],
    [
      './components/ToastViewport/ToastViewport.jsx',
      ['left-3', 'sm:left-auto'],
    ],
  ]

  for (const [file, snippets] of contracts) {
    assertSourceContains(file, snippets)
  }
})
