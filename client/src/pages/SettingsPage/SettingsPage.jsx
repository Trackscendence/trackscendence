import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import TwoFactorSettings from './_components/TwoFactorSettings'

// Settings wears the game's identity rather than a generic account skin: a
// warm header carrying the four-color dot motif from the in-game color picker,
// and each section tagged with an UNO card color the way the deck groups cards
// (Account blue, Password red, Two-factor green). Reached from the profile
// gear menu (#219). Avatar upload joins here once the client has a multipart
// request path; for now the profile edit dialog owns it.

// The four UNO colors, in the deck's usual order. The header echoes the wild
// color picker with these.
const DECK_DOTS = [
  { color: '#EA5A2A', name: 'red' },
  { color: '#F4C745', name: 'yellow' },
  { color: '#489E52', name: 'green' },
  { color: '#3684CC', name: 'blue' },
]

// One card per settings topic, tagged with its UNO color on the left edge and
// a matching eyebrow. A hook-free presenter, kept local to the page.
const SectionCard = ({ accent, eyebrow, title, description, children }) => (
  <section
    className="rounded-2xl border border-l-[6px] border-[#efdcc6] bg-white p-6 shadow-[0_10px_30px_rgba(61,18,0,0.06)]"
    style={{ borderLeftColor: accent }}
  >
    <p
      className="text-xs font-bold tracking-[0.14em] uppercase"
      style={{ color: accent }}
    >
      {eyebrow}
    </p>
    <h2 className="mt-1 text-lg font-black text-[#3d1200]">{title}</h2>
    {description ? (
      <p className="mt-2 text-sm text-[#8a6a52]">{description}</p>
    ) : null}
    <div className="mt-5">{children}</div>
  </section>
)

const InfoRow = ({ label, value }) => (
  <div className="rounded-xl bg-[#fbf1e6] px-4 py-3">
    <p className="text-xs font-semibold tracking-wide text-[#a07a5c] uppercase">
      {label}
    </p>
    <p className="mt-1 text-base font-semibold break-all text-[#3d1200]">
      {value}
    </p>
  </div>
)

const SettingsPage = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  const handleLogout = async () => {
    try {
      await useAuthStore.getState().logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-10 text-sm font-medium text-[#8a6a52]">
        Loading your account
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FFD9A8] to-[#F5B173] px-6 py-7 text-[#3d1200] sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <button
              className="text-xs font-semibold tracking-wide text-[#8a4a1e] uppercase transition hover:text-[#3d1200] focus:outline-none focus-visible:underline"
              type="button"
              onClick={() => navigate('/profile')}
            >
              &larr; Back to profile
            </button>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.02em] sm:text-4xl">
              Settings
            </h1>
            <p className="mt-1 text-sm text-[#7a3810]">
              Your account, password, and sign-in security.
            </p>
          </div>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {DECK_DOTS.map((dot) => (
              <span
                key={dot.name}
                className="h-3 w-3 rounded-full ring-2 ring-white/70"
                style={{ backgroundColor: dot.color }}
              />
            ))}
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          accent="#3684CC"
          eyebrow="Identity"
          title="Account"
          description="How you show up at the table."
        >
          <div className="space-y-3">
            <InfoRow label="Username" value={user.username} />
            <InfoRow label="Email" value={user.email} />
          </div>
        </SectionCard>

        <SectionCard
          accent="#EA5A2A"
          eyebrow="Access"
          title="Password"
          description="Rotate it if you think it has been exposed or want stronger access."
        >
          <button
            className="rounded-xl bg-[#EA5A2A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#cf4a1e] focus-visible:ring-2 focus-visible:ring-[#EA5A2A] focus-visible:ring-offset-2 focus-visible:outline-none"
            type="button"
            onClick={() => navigate('/change-password')}
          >
            Change password
          </button>
        </SectionCard>
      </div>

      <SectionCard
        accent="#489E52"
        eyebrow="Security"
        title="Two-factor authentication"
        description="Add a one-time code from an authenticator app on top of your password."
      >
        <TwoFactorSettings />
      </SectionCard>

      <div className="flex justify-end">
        <button
          className="rounded-xl border border-[#e2b3a3] px-5 py-2.5 text-sm font-semibold text-[#b6523b] transition hover:bg-[#fff1ed] focus-visible:ring-2 focus-visible:ring-[#b6523b] focus-visible:outline-none"
          type="button"
          onClick={handleLogout}
        >
          Log out
        </button>
      </div>
    </div>
  )
}

export default SettingsPage
