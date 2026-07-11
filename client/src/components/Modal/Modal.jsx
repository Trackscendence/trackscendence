import { useEffect } from 'react'
import { X } from 'lucide-react'
import Overlay from './_components/Overlay'

// Size is by named variant, not free-form width, so dialogs stay consistent:
// md is the compact confirmation width, lg is the wide flow width (roughly
// half a desktop viewport, like the profile's friend-request flow).
const SIZES = {
  md: 'max-w-md',
  lg: 'w-full max-w-2xl',
}

const Modal = ({
  children,
  isOpen,
  onClose,
  placement = 'center',
  size = 'md',
  title,
}) => {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <Overlay placement={placement} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={`flex max-h-[80vh] flex-col rounded-lg border border-[#d8dfd4] bg-white p-6 shadow-lg ${
          SIZES[size] ?? SIZES.md
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || onClose) && (
          <div className="mb-4 flex items-start justify-between gap-4">
            {title ? (
              <h2 className="text-lg font-semibold">{title}</h2>
            ) : (
              <span />
            )}
            {onClose && (
              <button
                aria-label="Close"
                className="shrink-0 rounded-full p-1 text-[#27352f] opacity-60 transition hover:opacity-100 focus:ring-2 focus:ring-current/30 focus:outline-none"
                type="button"
                onClick={onClose}
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </Overlay>
  )
}

export default Modal
