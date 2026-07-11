const TITLE_SIZES = {
  md: 'text-4xl',
  lg: 'text-5xl',
}

const AuthPageShell = ({
  children,
  className = '',
  contentClassName = '',
  fullScreen = false,
  title,
  titleSize = 'lg',
}) => {
  const surfaceClass = fullScreen
    ? 'bg-surface-warm flex min-h-screen items-center justify-center px-5 py-10 text-[#081934]'
    : 'flex flex-1 items-center justify-center px-5 py-10'
  const titleClass = TITLE_SIZES[titleSize] ?? TITLE_SIZES.lg

  return (
    <main className={`${surfaceClass} ${className}`}>
      <div className={`w-full max-w-[414px] ${contentClassName}`}>
        {title ? (
          <h1
            className={`mb-8 text-center ${titleClass} font-semibold text-[#081934] uppercase`}
          >
            {title}
          </h1>
        ) : null}
        {children}
      </div>
    </main>
  )
}

export default AuthPageShell
