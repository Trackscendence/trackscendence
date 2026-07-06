// Shown only while a pass is legal: the player drew a playable card this turn
// and chose not to play it. Playing the drawn card or passing both end the
// turn, so the button's presence doubles as the "you may still act" signal.

const PassTurnButton = ({ onPassClick }) => {
  return (
    <button
      className="focus-visible:ring-offset-surface-warm rounded-full bg-black px-6 py-2 text-sm font-black tracking-wide text-white uppercase shadow-md transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-none"
      onClick={onPassClick}
      type="button"
    >
      Pass
    </button>
  )
}

export default PassTurnButton
