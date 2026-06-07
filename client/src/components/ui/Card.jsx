

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2 ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ title, description, className = '' }) {
  return (
    <div className={`px-4 py-6 sm:px-8 border-b border-gray-900/10 ${className}`}>
      <h2 className="text-base font-semibold leading-7 text-gray-900">{title}</h2>
      {description && <p className="mt-1 text-sm leading-6 text-gray-600">{description}</p>}
    </div>
  )
}

export function CardContent({ children, className = '' }) {
  return <div className={`px-4 py-6 sm:px-8 ${className}`}>{children}</div>
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8 ${className}`}>
      {children}
    </div>
  )
}
