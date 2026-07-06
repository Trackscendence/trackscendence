const StatusLine = ({ isMatched, neededMore }) => {
  return (
    <span
      className={`text-[clamp(15px,1.4vw,19px)] transition-all duration-300 ${
        isMatched
          ? 'font-semibold text-[#489E52]'
          : 'font-medium text-[#9A7050]'
      }`}
    >
      {isMatched
        ? 'All players here'
        : `Need ${neededMore} more player${neededMore === 1 ? '' : 's'}`}
    </span>
  )
}

export default StatusLine
