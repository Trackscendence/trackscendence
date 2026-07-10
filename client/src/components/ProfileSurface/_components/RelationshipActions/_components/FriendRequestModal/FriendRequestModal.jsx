import { useState } from 'react'
import { MessageSquarePlus, Send } from 'lucide-react'
import Button from '@/components/Button'
import Modal from '@/components/Modal'
import useProfileStore from '@/stores/useProfileStore'

// Mirrors the server's friend-request message limit.
const MESSAGE_MAX_LENGTH = 500

// Two-step friend request (#395): first choose whether to say hello, then
// compose within the character limit. Owns the flow state; the send itself
// goes through the profile store, with or without a message.
const FriendRequestModal = ({ isOpen, onClose }) => {
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
    <Modal isOpen={isOpen} title="Send friend request" onClose={close}>
      {step === 'choose' ? (
        <div className="space-y-3">
          <p className="text-sm leading-6 text-[#6f5439]">
            Say hello first, or send the request on its own.
          </p>
          <Button
            className="flex items-center justify-center gap-2"
            type="button"
            variant="orange"
            onClick={() => setStep('compose')}
          >
            <MessageSquarePlus aria-hidden="true" className="h-4 w-4" />
            Add a message
          </Button>
          <Button
            disabled={isSubmitting}
            type="button"
            variant="orangeOutline"
            onClick={() => send('')}
          >
            {isSubmitting ? 'Sending' : 'Send without a message'}
          </Button>
        </div>
      ) : (
        <form className="space-y-3" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-[#3d1200]">
            Message
            <textarea
              autoFocus
              className="mt-2 min-h-28 w-full resize-none rounded-md border border-[#e6c9a8] px-3 py-2 text-sm transition outline-none focus:border-[#e86d2f]"
              maxLength={MESSAGE_MAX_LENGTH}
              required
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </label>
          <p className="text-right text-xs text-[#9a7050]">
            {message.length}/{MESSAGE_MAX_LENGTH}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="orangeOutline"
              onClick={() => setStep('choose')}
            >
              Back
            </Button>
            <Button
              className="flex items-center justify-center gap-2"
              disabled={isSubmitting || !message.trim()}
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
