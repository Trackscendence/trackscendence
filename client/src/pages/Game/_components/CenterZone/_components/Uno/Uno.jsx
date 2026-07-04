const Uno = ({ onUnoClick }) => {
  return (
    <button
      className="rounded-full bg-[#EA5A2A] px-5 py-2 text-sm font-black tracking-normal text-white shadow-md transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-surface-warm focus-visible:outline-none"
      onClick={onUnoClick}
      type="button"
    >
      UNO!
    </button>
  )
}

export default Uno
