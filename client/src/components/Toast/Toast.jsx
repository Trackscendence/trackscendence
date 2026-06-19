const STYLES = {
  info: 'border-[#bbd2c3] bg-[#eef7f1] text-[#24563f]',
  success: 'border-[#bbd2c3] bg-[#eef7f1] text-[#24563f]',
  error: 'border-[#e2a496] bg-[#fff1ed] text-[#8a321f]',
}

const Toast = ({ message, type = 'info', onDismiss }) => {
  return (
    <div
      className={`fixed right-4 bottom-4 z-50 rounded-md border px-4 py-3 text-sm shadow-md ${STYLES[type] ?? STYLES.info}`}
    >
      {message}
      {onDismiss && (
        <button className="ml-3 font-semibold underline" onClick={onDismiss}>
          Dismiss
        </button>
      )}
    </div>
  )
}

export default Toast
