const Card = ({ className = '', children }) => {
  return (
    <div
      className={`w-full max-w-md rounded-lg border border-[#d8dfd4] bg-white p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  )
}

export default Card
