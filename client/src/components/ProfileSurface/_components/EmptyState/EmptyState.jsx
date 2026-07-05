const EmptyState = ({ children, title }) => {
  return (
    <div className="bg-white px-5 py-8 text-center">
      <p className="text-sm font-semibold text-[#3d1200]">{title}</p>
      {children && <p className="mt-2 text-sm text-[#7a3810]">{children}</p>}
    </div>
  )
}

export default EmptyState
