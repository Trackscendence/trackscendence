const OpponentAvatar = ({ player }) => {
  if (player.avatarUrl) {
    return (
      <img
        alt={`${player.username} avatar`}
        className="size-[54px] rounded-full object-cover"
        src={player.avatarUrl}
      />
    )
  }

  return (
    <span
      aria-label={`${player.username} avatar`}
      className="block size-[54px] rounded-full bg-[#FFB347]"
      role="img"
    />
  )
}

export default OpponentAvatar
