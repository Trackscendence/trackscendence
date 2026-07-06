import { useEffect } from 'react'
import Overlay from './_components/Overlay'

const Modal = ({ children, isOpen, onClose, title }) => {
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
    <Overlay onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[80vh] max-w-md flex-col rounded-lg border border-[#d8dfd4] bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="mb-4 text-lg font-semibold">{title}</h2>}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </Overlay>
  )
}

export default Modal
