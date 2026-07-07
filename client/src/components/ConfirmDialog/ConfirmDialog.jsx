import Button from '@/components/Button'
import Modal from '@/components/Modal'

// A focused confirmation dialog for irreversible or security-weakening actions,
// replacing the browser's native confirm(). It composes Modal (so it inherits
// Escape/overlay dismissal and dialog semantics) and leads with a coloured badge
// that names the stakes: a red shield-with-alert for the destructive default.
//
// Tone drives both the badge and the confirm button so the visual weight always
// matches the action. The confirm button keeps the same verb as the control that
// opened it — "Disable 2FA" opens this and confirms with "Disable 2FA".
const TONES = {
  danger: { badge: 'bg-[#fdece7] text-[#b6523b]', confirmVariant: 'danger' },
  primary: { badge: 'bg-[#e7f1ff] text-[#0196FF]', confirmVariant: 'primary' },
}

const ShieldAlertIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="15.5" x2="12.01" y2="15.5" />
  </svg>
)

const ConfirmDialog = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  confirmingLabel = 'Working…',
  cancelLabel = 'Cancel',
  tone = 'danger',
  isConfirming = false,
  icon = <ShieldAlertIcon />,
  onConfirm,
  onCancel,
}) => {
  const { badge, confirmVariant } = TONES[tone] ?? TONES.danger

  return (
    <Modal isOpen={isOpen} onClose={onCancel}>
      <div className="flex gap-4">
        <div
          className={`flex h-12 w-12 flex-none items-center justify-center rounded-full ${badge}`}
        >
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#27352f]">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-[#514336]">{description}</p>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button
          fullWidth={false}
          variant="outline"
          onClick={onCancel}
          disabled={isConfirming}
        >
          {cancelLabel}
        </Button>
        <Button
          fullWidth={false}
          variant={confirmVariant}
          onClick={onConfirm}
          disabled={isConfirming}
        >
          {isConfirming ? confirmingLabel : confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
