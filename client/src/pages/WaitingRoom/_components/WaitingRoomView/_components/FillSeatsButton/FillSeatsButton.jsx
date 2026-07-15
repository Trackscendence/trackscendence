const FillSeatsButton = ({ onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[14px] bg-[#2f7d61] px-6 py-2.5 text-[13px] font-semibold text-white transition-[background,transform] hover:bg-[#276a52] active:scale-[0.97] sm:w-auto sm:px-7"
    >
      Add bots
    </button>
  )
}

export default FillSeatsButton
