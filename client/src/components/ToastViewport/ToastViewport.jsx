import Toast from '@/components/Toast'

// Toasts stack in the top-right corner, below the app header so they never
// cover the bell and mail controls they often relate to.
const ToastViewport = ({ notifications = [], onDismiss }) => {
  if (notifications.length === 0) return null

  return (
    <div className="pointer-events-none fixed top-24 right-4 z-50 flex w-[min(calc(100vw-2rem),24rem)] flex-col gap-3">
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <Toast
            message={notification.message}
            type={notification.type}
            onDismiss={() => onDismiss(notification.id)}
          />
        </div>
      ))}
    </div>
  )
}

export default ToastViewport
