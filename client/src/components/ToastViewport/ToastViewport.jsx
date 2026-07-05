import Toast from '@/components/Toast'

const ToastViewport = ({ notifications = [], onDismiss }) => {
  if (notifications.length === 0) return null

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(calc(100vw-2rem),24rem)] flex-col gap-3">
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
