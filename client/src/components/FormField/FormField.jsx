const FormField = ({ label, hint, children, ...props }) => {
  return (
    <label className="block" {...props}>
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <p className="mt-2 text-xs text-[#50635a]">{hint}</p>}
    </label>
  )
}

export default FormField
