const VARIANTS = {
  primary: 'bg-[#2f7d61] text-white hover:bg-[#276a52] disabled:bg-[#91a69b]',
  outline:
    'border border-[#cbd5c5] bg-transparent text-[#27352f] hover:border-[#2f7d61] hover:text-[#2f7d61]',
}

const Button = ({
  children,
  variant = 'primary',
  className = '',
  ...props
}) => {
  return (
    <button
      className={`w-full rounded-md px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed ${VARIANTS[variant] ?? VARIANTS.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
