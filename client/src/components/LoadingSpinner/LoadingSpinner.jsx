const LoadingSpinner = ({ message = 'Loading' }) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f7f2] text-sm font-medium text-[#27352f]">
      {message}
    </div>
  )
}

export default LoadingSpinner
