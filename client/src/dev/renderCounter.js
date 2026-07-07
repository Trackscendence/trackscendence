// Dev-only render instrumentation. Every access is guarded by
// import.meta.env.DEV, so production builds statically drop these branches and
// never touch window. A Playwright script reads window.__renderCounts to assert
// how many times each component re-renders per game_state_update (audit E7).

export const bump = (name) => {
  if (!import.meta.env.DEV) return
  if (!window.__renderCounts) window.__renderCounts = {}
  window.__renderCounts[name] = (window.__renderCounts[name] ?? 0) + 1
}

export const reset = () => {
  if (!import.meta.env.DEV) return
  window.__renderCounts = {}
}
