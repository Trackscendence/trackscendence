import { useState } from 'react'
import Button from '@/components/Button'
import Modal from '@/components/Modal'

// A ban is indefinite, so it carries no duration — only the reason, which
// lands in the audit log. Reinstating later is an explicit admin action.
const BanDialog = ({ user, isConfirming, onConfirm, onCancel }) => {
  const [reason, setReason] = useState('')

  return (
    <Modal isOpen onClose={onCancel}>
      <h2 className="text-lg font-semibold text-[#27352f]">
        Ban @{user.username}
      </h2>
      <p className="mt-2 text-sm leading-6 text-[#514336]">
        They cannot sign in again until an admin reinstates them. Their current
        sessions end immediately.
      </p>
      <label className="mt-4 block text-sm font-semibold text-[#27352f]">
        Reason
        {/* Focus lands on the reason field when the dialog opens (#505). */}
        <textarea
          autoFocus
          className="mt-1 w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-sm text-[#27352f] focus:border-[#e86d2f] focus:outline-none"
          rows={2}
          value={reason}
          placeholder="Recorded in the audit log"
          onChange={(event) => setReason(event.target.value)}
        />
      </label>
      <div className="mt-6 flex justify-end gap-3">
        <Button
          fullWidth={false}
          variant="outline"
          onClick={onCancel}
          disabled={isConfirming}
        >
          Cancel
        </Button>
        <Button
          fullWidth={false}
          variant="danger"
          onClick={() => onConfirm(reason.trim())}
          disabled={isConfirming || !reason.trim()}
        >
          {isConfirming ? 'Banning…' : 'Ban'}
        </Button>
      </div>
    </Modal>
  )
}

export default BanDialog
