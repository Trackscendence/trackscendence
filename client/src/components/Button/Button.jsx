const VARIANTS = {
  primary: 'bg-[#2f7d61] text-white hover:bg-[#276a52] disabled:bg-[#91a69b]',
  outline:
    'border border-[#cbd5c5] bg-transparent text-[#27352f] hover:border-[#2f7d61] hover:text-[#2f7d61]',
  blue: 'bg-[#0196FF] text-white uppercase tracking-widest hover:bg-[#0080e0] disabled:bg-[#7ec4ff]',
  social: 'bg-[#D9D9D9] text-black hover:bg-[#c8c8c8] !py-1',
  orange: 'bg-[#e86d2f] text-white hover:bg-[#c95b24] disabled:bg-[#dda37e]',
  orangeOutline:
    'border border-[#e86d2f] bg-white text-[#e86d2f] hover:bg-[#fff8f2]',
  danger: 'bg-[#b6523b] text-white hover:bg-[#9d4531] disabled:bg-[#d3a597]',
}

const Button = ({
  children,
  fullWidth = true,
  variant = 'primary',
  className = '',
  ...props
}) => {
  return (
    <button
      className={`${fullWidth ? 'w-full' : 'w-auto'} rounded-md px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed ${VARIANTS[variant] ?? VARIANTS.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
