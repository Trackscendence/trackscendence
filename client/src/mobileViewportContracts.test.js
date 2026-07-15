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
    ['./layouts/AppLayout/AppLayout.jsx', ['min-h-[100dvh]', 'flex-col']],
    [
      './components/AppHeader/AppHeader.jsx',
      ['flex-col', 'sm:flex-row', 'w-full'],
    ],
    [
      './layouts/AppLayout/_components/Navbar/Navbar.jsx',
      ['flex-col', 'sm:flex-row', 'w-full'],
    ],
    ['./layouts/AuthLayout/AuthLayout.jsx', ['min-h-[100dvh]', 'flex-col']],
    [
      './layouts/ProfileLayout/ProfileLayout.jsx',
      ['min-h-[100dvh]', 'flex-col', 'sm:flex-row'],
    ],
    [
      './pages/Lobby/_components/LobbyView/LobbyView.jsx',
      ['min-h-[100dvh]', 'flex-col'],
    ],
    ['./pages/AdminAccess/AdminAccess.jsx', ['grid gap-6', 'lg:grid-cols']],
    ['./pages/Session/Session.jsx', ['grid gap-4', 'sm:grid-cols-2']],
    [
      './pages/WaitingRoom/_components/WaitingRoomView/WaitingRoomView.jsx',
      ['min-h-[100dvh]', 'flex-col', 'overflow-hidden'],
    ],
    [
      './pages/Messages/Messages.jsx',
      ['grid-cols-1', 'lg:grid-cols-[360px_minmax(0,1fr)]'],
    ],
    [
      './pages/Game/_components/GameTable/GameTable.jsx',
      [
        'grid-cols-1',
        'overflow-x-hidden',
        'grid-rows-[auto_auto_auto_auto_auto]',
      ],
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
