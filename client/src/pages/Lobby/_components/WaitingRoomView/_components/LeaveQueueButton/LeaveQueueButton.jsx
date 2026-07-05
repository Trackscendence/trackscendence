const LeaveQueueButton = ({ onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[14px] border-[0.5px] border-[rgba(200,149,106,0.6)] px-7 py-2.5 text-[13px] font-semibold text-[#6A4A20] transition-[background,transform] hover:bg-[rgba(200,149,106,0.1)] active:scale-[0.97]"
    >
      Leave Queue
    </button>
  )
}

export default LeaveQueueButton
