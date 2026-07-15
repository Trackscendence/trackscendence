export const createPlayerSearchRunGate = () => {
  let activeRunId = 0

  return {
    beginRun: () => {
      activeRunId += 1
      return activeRunId
    },
    isCurrentRun: (runId) => activeRunId === runId,
    invalidateRun: () => {
      activeRunId += 1
    },
    supersedeRun: (runId) => {
      if (activeRunId === runId) {
        activeRunId += 1
      }
    },
  }
}
