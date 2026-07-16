import { useEffect, useRef, useState } from 'react'
import { EllipsisVertical } from 'lucide-react'
import ConfirmDialog from '@/components/ConfirmDialog'

// The overflow menu at the far right of a conversation header. It owns only its
// own open/confirm state and reaches the block actions through props, so the
// thread stays a presenter. When the other user has blocked me there is nothing
// I can do here, so the trigger is not rendered.
const ThreadHeaderMenu = ({ friendName, blockState, onBlock, onUnblock }) => {
  const menuRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isConfirmingBlock, setIsConfirmingBlock] = useState(false)
  const [isBlocking, setIsBlocking] = useState(false)

  useEffect(() => {
    if (!isOpen) return undefined
    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  if (blockState === 'blockedByThem') return null

  const isBlockedByMe = blockState === 'blockedByMe'

  const confirmBlock = async () => {
    setIsBlocking(true)
    try {
      await onBlock()
    } finally {
      setIsBlocking(false)
      setIsConfirmingBlock(false)
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-label="Conversation options"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex h-9 w-9 items-center justify-center rounded-full text-[#7a3810] transition hover:bg-[#fff4e8] focus:ring-2 focus:ring-[#3d1200]/20 focus:outline-none"
        type="button"
        onClick={() => setIsOpen((open) => !open)}
      >
        <EllipsisVertical aria-hidden="true" className="h-5 w-5" />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-48 overflow-hidden rounded-md border border-[#e6c9a8] bg-white py-1 shadow-lg"
        >
          {isBlockedByMe ? (
            <button
              role="menuitem"
              type="button"
              className="block w-full truncate px-4 py-2 text-left text-sm font-medium text-[#3d1200] transition hover:bg-[#fbf1e6] focus:bg-[#fbf1e6] focus:outline-none"
              onClick={() => {
                setIsOpen(false)
                onUnblock()
              }}
            >
              Unblock {friendName}
            </button>
          ) : (
            <button
              role="menuitem"
              type="button"
              className="block w-full truncate px-4 py-2 text-left text-sm font-medium text-[#b6523b] transition hover:bg-[#fbf1e6] focus:bg-[#fbf1e6] focus:outline-none"
              onClick={() => {
                setIsOpen(false)
                setIsConfirmingBlock(true)
              }}
            >
              Block {friendName}
            </button>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={isConfirmingBlock}
        title={`Block ${friendName}?`}
        description="They won't be able to message you, and you won't see new messages from them. You can unblock them at any time."
        confirmLabel="Block"
        confirmingLabel="Blocking…"
        isConfirming={isBlocking}
        onConfirm={confirmBlock}
        onCancel={() => setIsConfirmingBlock(false)}
      />
    </div>
  )
}

export default ThreadHeaderMenu
