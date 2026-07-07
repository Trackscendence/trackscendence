import { useState } from 'react'

const CreateRoomForm = ({ isSubmitting, onCreateRoom }) => {
  const [name, setName] = useState('')
  const [visibility, setVisibility] = useState('PUBLIC')

  const handleSubmit = async (event) => {
    event.preventDefault()
    const room = await onCreateRoom({ name, visibility })
    if (room) {
      setName('')
      setVisibility('PUBLIC')
    }
  }

  return (
    <form className="mt-4 space-y-2" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="chat-room-name">
        Room name
      </label>
      <input
        className="w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-sm outline-none focus:border-[#2f7d61] focus:ring-2 focus:ring-[#2f7d61]/20"
        id="chat-room-name"
        maxLength={48}
        onChange={(event) => setName(event.target.value)}
        placeholder="Room name"
        value={name}
      />
      <label className="sr-only" htmlFor="chat-room-visibility">
        Room visibility
      </label>
      <select
        className="w-full rounded-md border border-[#cbd5c5] bg-white px-3 py-2 text-sm outline-none focus:border-[#2f7d61] focus:ring-2 focus:ring-[#2f7d61]/20"
        id="chat-room-visibility"
        onChange={(event) => setVisibility(event.target.value)}
        value={visibility}
      >
        <option value="PUBLIC">Public</option>
        <option value="INVITE_ONLY">Invite-only</option>
      </select>
      <button
        className="w-full rounded-md bg-[#2f7d61] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#276a52] disabled:cursor-not-allowed disabled:bg-[#9caf9f]"
        disabled={isSubmitting || !name.trim()}
        type="submit"
      >
        Create room
      </button>
    </form>
  )
}

export default CreateRoomForm
