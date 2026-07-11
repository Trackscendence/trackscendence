import { useState } from 'react'
import { Send } from 'lucide-react'
import Button from '@/components/Button'
import Modal from '@/components/Modal'
import useProfileStore from '@/stores/useProfileStore'

// Mirrors the server's friend-request message limit.
const MESSAGE_MAX_LENGTH = 500

// Two-step friend request (#395), sized and anchored like a connect dialog:
// wide, hanging below the header, actions bottom-right. Step one chooses
// whether to say hello; step two composes within the character limit. The
// send itself goes through the profile store, with or without a message.
const FriendRequestModal = ({ displayName, isOpen, onClose }) => {
  const [step, setStep] = useState('choose')
  const [message, setMessage] = useState('')
  const isSubmitting = useProfileStore((state) => state.isSubmitting)

  const close = () => {
    setStep('choose')
    setMessage('')
    onClose()
  }

  const send = async (text) => {
    const wasSent = await useProfileStore.getState().sendFriendRequest(text)
    if (wasSent) close()
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    send(message.trim())
  }

  return (
    <Modal
      isOpen={isOpen}
      placement="top"
      size="lg"
      title="Add a message to your request?"
      onClose={close}
    >
      {step === 'choose' ? (
        <div className="space-y-6">
          <p className="text-sm leading-6 text-[#6f5439]">
            Say hello to <span className="font-semibold">{displayName}</span>{' '}
            before you play together. A request with a message is easier to
            recognize and becomes the first message of your conversation.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              fullWidth={false}
              type="button"
              variant="orangeOutline"
              onClick={() => setStep('compose')}
            >
              Add a message
            </Button>
            <Button
              disabled={isSubmitting}
              fullWidth={false}
              type="button"
              variant="orange"
              onClick={() => send('')}
            >
              {isSubmitting ? 'Sending' : 'Send without a message'}
            </Button>
          </div>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-[#3d1200]">
            Message
            <textarea
              autoFocus
              className="mt-2 min-h-40 w-full resize-none rounded-md border border-[#e6c9a8] px-3 py-2 text-sm leading-6 transition outline-none focus:border-[#e86d2f]"
              maxLength={MESSAGE_MAX_LENGTH}
              placeholder={`Write a short hello to ${displayName}`}
              required
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </label>
          <p className="text-right text-xs text-[#9a7050]">
            {message.length}/{MESSAGE_MAX_LENGTH}
          </p>
          <div className="flex justify-end gap-3">
            <Button
              fullWidth={false}
              type="button"
              variant="orangeOutline"
              onClick={() => setStep('choose')}
            >
              Back
            </Button>
            <Button
              className="flex items-center justify-center gap-2"
              disabled={isSubmitting || !message.trim()}
              fullWidth={false}
              type="submit"
              variant="orange"
            >
              <Send aria-hidden="true" className="h-4 w-4" />
              {isSubmitting ? 'Sending' : 'Send request'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}

export default FriendRequestModal
