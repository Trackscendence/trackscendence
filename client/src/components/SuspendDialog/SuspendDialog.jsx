import { useState } from 'react'
import Button from '@/components/Button'
import Modal from '@/components/Modal'

const DURATIONS = [
  { days: 1, label: '24 hours' },
  { days: 3, label: '3 days' },
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
]

const FIELD_CLASS =
  'mt-1 w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-sm text-[#27352f] focus:border-[#e86d2f] focus:outline-none'

// Suspension needs two inputs a bare confirm cannot carry: how long, and why
// (the reason lands in the audit log). Suspensions are always time-boxed;
// indefinite removal is a ban.
const SuspendDialog = ({ user, isConfirming, onConfirm, onCancel }) => {
  const [days, setDays] = useState(DURATIONS[0].days)
  const [reason, setReason] = useState('')

  const handleConfirm = () => {
    const suspendedUntil = new Date(
      Date.now() + days * 24 * 60 * 60 * 1000,
    ).toISOString()
    onConfirm({ suspendedUntil, reason: reason.trim() })
  }

  return (
    <Modal isOpen onClose={onCancel}>
      <h2 className="text-lg font-semibold text-[#27352f]">
        Suspend @{user.username}
      </h2>
      <p className="mt-2 text-sm leading-6 text-[#514336]">
        They cannot sign in until the suspension expires; it lifts on its own
        after that. Their current sessions end immediately.
      </p>
      <label className="mt-4 block text-sm font-semibold text-[#27352f]">
        Duration
        {/* Focus lands on the first input when the dialog opens (#505), the
            same pattern FriendRequestModal uses. */}
        <select
          autoFocus
          className={FIELD_CLASS}
          value={days}
          onChange={(event) => setDays(Number(event.target.value))}
        >
          {DURATIONS.map((duration) => (
            <option key={duration.days} value={duration.days}>
              {duration.label}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-3 block text-sm font-semibold text-[#27352f]">
        Reason
        <textarea
          className={FIELD_CLASS}
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
          onClick={handleConfirm}
          disabled={isConfirming || !reason.trim()}
        >
          {isConfirming ? 'Suspending…' : 'Suspend'}
        </Button>
      </div>
    </Modal>
  )
}

export default SuspendDialog
