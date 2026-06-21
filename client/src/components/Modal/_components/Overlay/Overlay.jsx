const Overlay = ({ children, onClick }) => {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-5"
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export default Overlay
