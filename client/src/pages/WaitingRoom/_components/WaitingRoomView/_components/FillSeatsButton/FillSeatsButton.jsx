const FillSeatsButton = ({ onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[14px] bg-[#2f7d61] px-7 py-2.5 text-[13px] font-semibold text-white transition-[background,transform] hover:bg-[#276a52] active:scale-[0.97]"
    >
      Add bots
    </button>
  )
}

export default FillSeatsButton
