import Button from '@/components/Button'

// Replaces the composer once a conversation is blocked. The blocker sees a way
// back (Unblock); the person who was blocked only sees why they cannot reply,
// with no control to change it.
const BlockedBanner = ({ friendName, blockState, onUnblock }) => {
  if (blockState === 'blockedByMe') {
    return (
      <div className="border-t border-[#f0d9bd] px-5 py-4 text-center">
        <p className="text-sm font-semibold text-[#3d1200]">
          You blocked {friendName}
        </p>
        <p className="mt-1 text-xs text-[#9a7050]">
          They cannot message you while they are blocked. Unblock to start
          talking again.
        </p>
        <div className="mt-3 flex justify-center">
          <Button fullWidth={false} variant="outline" onClick={onUnblock}>
            Unblock {friendName}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="border-t border-[#f0d9bd] px-5 py-5 text-center">
      <p className="text-sm font-semibold text-[#9a7050]">
        You cannot reply to this conversation right now.
      </p>
    </div>
  )
}

export default BlockedBanner
