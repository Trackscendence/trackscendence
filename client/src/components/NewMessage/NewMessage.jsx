import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { composeMessagePath } from '@/utils/conversationPath'

// The round plus link that opens the compose-message flow, shared by the
// direct-message dropdown and the Messages page header so the affordance
// (route, label, icon) cannot drift between the two entry points. `sm`
// matches the dropdown's compact control row; `md` is the page header.
const SIZES = {
  sm: { link: 'h-8 w-8', icon: 'h-4 w-4' },
  md: { link: 'h-9 w-9', icon: 'h-5 w-5' },
}

const NewMessage = ({ size = 'md', onClick }) => (
  <Link
    aria-label="New message"
    title="New message"
    to={composeMessagePath}
    className={`flex ${SIZES[size].link} items-center justify-center rounded-full text-[#7a3810] transition hover:bg-[#fff4e8] focus:ring-2 focus:ring-[#3d1200]/20 focus:outline-none`}
    onClick={onClick}
  >
    <Plus aria-hidden="true" className={SIZES[size].icon} strokeWidth={2.4} />
  </Link>
)

export default NewMessage
