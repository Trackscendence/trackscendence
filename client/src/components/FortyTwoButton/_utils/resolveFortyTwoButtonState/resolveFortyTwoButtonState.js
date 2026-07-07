// Decides how the 42 button presents itself from its three independent flags.
// Pulled out of the JSX so the precedence — and the "immediate feedback on
// click" behaviour — is a plain function that can be asserted without a DOM.
//
// The flags are mutually exclusive in practice (checking requires the provider
// probe to be in flight; comingSoon requires it to have finished), but the
// function still defines a total order so a caller can never land in an
// ambiguous state: connecting wins (it is the most recent user action), then
// checking, then comingSoon, otherwise the button is ready.
export const resolveFortyTwoButtonState = ({
  comingSoon = true,
  isChecking = false,
  isConnecting = false,
} = {}) => {
  const isDisabled = comingSoon || isChecking || isConnecting

  const title = isChecking
    ? 'Checking availability'
    : comingSoon
      ? 'Coming soon'
      : undefined

  const mode = isConnecting
    ? 'connecting'
    : isChecking
      ? 'checking'
      : comingSoon
        ? 'comingSoon'
        : 'ready'

  return { isDisabled, title, mode }
}
