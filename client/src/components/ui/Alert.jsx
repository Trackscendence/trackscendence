

export function Alert({ children, variant = 'error', className = '' }) {
  const variants = {
    error: 'bg-red-50 text-red-700 border-red-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  }

  return (
    <div className={`rounded-md border p-4 text-sm ${variants[variant]} ${className}`} role="alert">
      {children}
    </div>
  )
}
