const TypingIndicator = ({ friendName }) => {
  return (
    <div className="flex justify-start" aria-live="polite">
      <div className="max-w-[75%] rounded-lg border border-[#f0d9bd] bg-white px-4 py-3 text-[#3d1200]">
        <span className="sr-only">{friendName} is typing</span>
        <span aria-hidden="true" className="flex h-3 items-center gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9a7050] [animation-delay:-0.2s] motion-reduce:animate-none" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9a7050] [animation-delay:-0.1s] motion-reduce:animate-none" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9a7050] motion-reduce:animate-none" />
        </span>
      </div>
    </div>
  )
}

export default TypingIndicator
