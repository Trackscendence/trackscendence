const Avatar = ({ src, alt = '', size = 40, online }) => {
  return (
    <div className="relative inline-block">
      <img
        src={src || '/default-avatar.png'}
        alt={alt}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
      {online !== undefined && (
        <span
          className={`absolute right-0 bottom-0 block h-2.5 w-2.5 rounded-full border-2 border-white ${online ? 'bg-[#2f7d61]' : 'bg-[#91a69b]'}`}
        />
      )}
    </div>
  )
}

export default Avatar
