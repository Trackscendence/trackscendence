// Leaving isn't wired yet — players stay queued until a match forms (issue #153).
// Rendered per design; the handler will call the store's leaveLobby action once
// the leave flow (server `leave_lobby`, #88) is available.
const LeaveQueueButton = () => {
  return (
    <button
      type="button"
      className="rounded-[14px] border-[0.5px] border-[rgba(200,149,106,0.6)] px-7 py-2.5 text-[13px] font-semibold text-[#6A4A20] transition-[background,transform] hover:bg-[rgba(200,149,106,0.1)] active:scale-[0.97]"
    >
      Leave Queue
    </button>
  )
}

export default LeaveQueueButton
