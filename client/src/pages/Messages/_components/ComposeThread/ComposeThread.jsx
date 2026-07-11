import { useState } from 'react'
import getPlayerIdentity from '@/utils/getPlayerIdentity'
import MessageComposer from '../MessageComposer'
import RecipientField from './_components/RecipientField'

// The "+" destination: pick a recipient, write the first message. The To: row
// reuses the shared PlayerSearch, so any player can be picked; the server
// only delivers between friends, and a send to a non-friend surfaces that
// rule as an error toast while the draft stays in the input.
const ComposeThread = ({ onSend }) => {
  const [recipient, setRecipient] = useState(null)

  return (
    <section className="flex min-h-0 flex-col bg-white">
      <header className="border-b border-[#f0d9bd] px-5 py-4">
        <h2 className="text-lg font-black text-[#3d1200]">
          Compose New Message
        </h2>
        <p className="text-xs font-semibold text-[#9a7050]">
          Direct messages are between friends.
        </p>
      </header>

      <div className="flex min-h-0 flex-1 items-center justify-center bg-[#fff7ed] px-6 text-center">
        <div>
          <p className="text-sm font-black text-[#3d1200]">
            {recipient
              ? `Message ${getPlayerIdentity(recipient).name}`
              : 'Search for a player to message'}
          </p>
          <p className="mt-1 text-xs text-[#9a7050]">
            {recipient
              ? 'Your first message opens the conversation.'
              : 'Type a name below and press Enter.'}
          </p>
        </div>
      </div>

      <RecipientField
        recipient={recipient}
        onClear={() => setRecipient(null)}
        onPick={setRecipient}
      />

      {/* Keyed per recipient so picking someone else starts a fresh draft
          with the cursor already in the input. */}
      <MessageComposer
        key={recipient?.id ?? 'no-recipient'}
        autoFocus={Boolean(recipient)}
        disabled={!recipient}
        onSend={(text) => (recipient ? onSend(recipient.id, text) : false)}
      />
    </section>
  )
}

export default ComposeThread
