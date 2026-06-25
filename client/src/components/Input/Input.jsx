const Input = ({ className = '', ...props }) => {
  return (
    <input
      className={`mt-2 w-full rounded-md border border-black px-3 py-2 text-base transition outline-none focus:border-[#0196FF] focus:ring-2 focus:ring-[#0196FF]/20 ${className}`}
      {...props}
    />
  )
}

export default Input
