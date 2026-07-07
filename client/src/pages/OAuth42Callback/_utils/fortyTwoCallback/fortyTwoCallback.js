// Pure decision logic for the 42 OAuth callback screen. The component owns the
// effects (completing the login, timers, navigation); these functions own the
// "what should we show / where should we go" choices so they can be asserted
// without rendering.

// Shown when 42 redirects back without the pieces we need to finish the
// exchange — the user cancelled on the intra consent screen, or the provider
// dropped the code/state.
export const CALLBACK_INCOMPLETE_MESSAGE =
  'The 42 sign-in was cancelled or incomplete.'

// Reads the callback query string into the values the flow branches on.
// `getParam` is any `(key) => string | null` — in the component it is
// `searchParams.get`; in tests it is a plain lookup over an object.
export const readCallbackParams = (getParam) => {
  const code = getParam('code')
  const state = getParam('state')
  const providerError = getParam('error_description') || getParam('error')

  const paramError =
    providerError || (!code || !state ? CALLBACK_INCOMPLETE_MESSAGE : '')

  return { code, state, paramError }
}

// Post-login branch: 42 accounts can still owe a second factor, in which case
// we hand back to the login page carrying the challenge instead of landing in
// the app.
export const resolveLoginResult = (result) => {
  if (result?.requiresTwoFactor) {
    return { type: 'twoFactor', challenge: result }
  }

  return { type: 'signedIn', user: result?.user ?? null }
}

// Which of the three full-screen views the callback renders. Order matters: a
// failure is terminal, a completed sign-in shows the confirmation, and until
// either resolves we are still connecting.
export const selectCallbackView = ({ error, signedInUser }) => {
  if (error) return 'error'
  if (signedInUser) return 'success'
  return 'connecting'
}
