const Input = ({ className = '', ...props }) => {
  return (
    <input
      className={`mt-2 w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-base transition outline-none focus:border-[#2f7d61] focus:ring-2 focus:ring-[#2f7d61]/20 ${className}`}
      {...props}
    />
  )
}

export default Input
