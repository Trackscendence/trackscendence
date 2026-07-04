// Two radio styles for The Rig. `segmented` is a compact console strip for
// low-stakes picks (which identity to fake). `dotted` is the classic,
// unmistakable radio for the one choice that really matters: real vs. fake.
const RadioGroup = ({
  label,
  name,
  value,
  options,
  onChange,
  variant = 'segmented',
}) => {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-mono text-[11px] tracking-wider text-[#B39B7C] uppercase">
        {label}
      </legend>

      {variant === 'segmented' ? (
        <div className="flex overflow-hidden rounded-md border border-[#FDE8CF]/15 bg-[#2B1E12]">
          {options.map((option) => {
            const selected = option.value === value
            return (
              <label
                key={option.value}
                className={[
                  'flex-1 cursor-pointer border-b-2 px-2 py-1.5 text-center font-mono text-[12px] transition-colors',
                  'focus-within:ring-2 focus-within:ring-[#FFB04F] focus-within:ring-inset',
                  selected
                    ? 'border-[#FFB04F] bg-[#FDE8CF] text-[#1C120A]'
                    : 'border-transparent text-[#B39B7C] hover:text-[#FDE8CF]',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={selected}
                  onChange={() => onChange(option.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {options.map((option) => {
            const selected = option.value === value
            return (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 font-mono text-[13px] text-[#FDE8CF]"
              >
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={selected}
                  onChange={() => onChange(option.value)}
                  className="sr-only"
                />
                <span
                  className={[
                    'grid h-4 w-4 place-items-center rounded-full border transition-colors',
                    selected ? 'border-[#FFB04F]' : 'border-[#FDE8CF]/25',
                  ].join(' ')}
                >
                  {selected ? (
                    <span className="h-2 w-2 rounded-full bg-[#FFB04F]" />
                  ) : null}
                </span>
                {option.label}
              </label>
            )
          })}
        </div>
      )}
    </fieldset>
  )
}

export default RadioGroup
