const StatusLine = ({ isMatched }) => {
  return (
    <span
      className={`text-[clamp(15px,1.4vw,19px)] transition-all duration-300 ${
        isMatched
          ? 'font-semibold text-[#489E52]'
          : 'font-medium text-[#9A7050]'
      }`}
    >
      {isMatched ? 'All players here' : 'Need one more'}
    </span>
  )
}

export default StatusLine
