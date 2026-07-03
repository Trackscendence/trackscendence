const Avatar = ({
  alt = '',
  className = '',
  initials = '',
  online,
  size = 40,
  src,
}) => {
  return (
    <div className="relative inline-block">
      {src ? (
        <img
          src={src}
          alt={alt}
          width={size}
          height={size}
          className={`rounded-full object-cover ${className}`}
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          aria-label={alt}
          className={`flex items-center justify-center rounded-full bg-[#FFB04F] font-semibold text-white ${className}`}
          role="img"
          style={{ width: size, height: size }}
        >
          {initials}
        </div>
      )}
      {online !== undefined && (
        <span
          className={`absolute right-0 bottom-0 block h-2.5 w-2.5 rounded-full border-2 border-white ${online ? 'bg-[#2f7d61]' : 'bg-[#91a69b]'}`}
        />
      )}
    </div>
  )
}

export default Avatar
