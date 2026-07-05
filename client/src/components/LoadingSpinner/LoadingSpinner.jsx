// `className` carries the surface colors so screens outside the default grey
// palette (e.g. the warm game flow) can keep their own background while
// loading.
const LoadingSpinner = ({
  message = 'Loading',
  className = 'bg-[#f4f7f2] text-[#27352f]',
}) => {
  return (
    <div
      className={`flex min-h-screen items-center justify-center text-sm font-medium ${className}`}
    >
      {message}
    </div>
  )
}

export default LoadingSpinner
