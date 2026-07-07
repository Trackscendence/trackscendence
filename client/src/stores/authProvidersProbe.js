export const PROVIDERS_PROBE_MAX_ATTEMPTS = 80
export const PROVIDERS_PROBE_RETRY_MS = 1500

export const defaultProvidersProbeDelay = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export const loadAuthProvidersWithRetry = async ({
  fetchAuthProviders,
  set,
  delay = defaultProvidersProbeDelay,
  maxAttempts = PROVIDERS_PROBE_MAX_ATTEMPTS,
  retryMs = PROVIDERS_PROBE_RETRY_MS,
}) => {
  set({ isAuthProvidersLoading: true })

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const { providers } = await fetchAuthProviders()
      set({
        isFortyTwoLoginEnabled: Boolean(providers?.fortyTwo),
        isAuthProvidersLoading: false,
      })
      return { providers }
    } catch {
      if (attempt < maxAttempts) {
        await delay(retryMs)
      }
    }
  }

  set({ isAuthProvidersLoading: false })
  return null
}
