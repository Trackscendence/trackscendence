import { ShieldCheck } from 'lucide-react'
import { USER_ROLES } from '@/utils/authorization'

// The operator mark (#498). The app accent is everywhere, so it cannot signal
// authority; this pill spends the palette's darkest token as its fill with
// warm cream text — the one place ink becomes a background. Props-driven: it
// renders only when the subject's role is ADMIN and reads no store, so any
// caller (header chip, profile pages, Players rows) can pass a role straight
// through, including a missing one.
const AdminBadge = ({ role, className = '' }) => {
  if (role !== USER_ROLES.ADMIN) return null

  return (
    <span
      className={`bg-admin-ink text-admin-cream inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${className}`}
    >
      <ShieldCheck aria-hidden="true" className="h-3 w-3" />
      Admin
    </span>
  )
}

export default AdminBadge
