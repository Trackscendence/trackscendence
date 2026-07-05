import { Link } from 'react-router-dom'
import exitIcon from '@/assets/game/emergency-exit.svg'

const ExitGameButton = () => {
  return (
    <Link
      aria-label="Exit game"
      className="focus-visible:ring-offset-surface-warm absolute top-4 right-4 z-20 size-12 transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-none"
      to="/"
    >
      <img alt="Exit game" className="size-full" src={exitIcon} />
    </Link>
  )
}

export default ExitGameButton
