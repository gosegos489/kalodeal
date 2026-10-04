type Options = {
  refresh: () => void
  isVisible: () => boolean
  schedule: (callback: () => void) => () => void
}

export function createRouteRefreshPoller({ refresh, isVisible, schedule }: Options) {
  let cancelScheduled: (() => void) | undefined
  let busy = false
  let stopped = false
  let refreshOnCompletion = false

  function cancel() {
    cancelScheduled?.()
    cancelScheduled = undefined
  }

  function scheduleNext() {
    cancel()
    if (!stopped && !busy && isVisible()) cancelScheduled = schedule(requestRefresh)
  }

  function requestRefresh() {
    cancel()
    if (stopped || !isVisible()) return
    if (busy) {
      refreshOnCompletion = true
      return
    }
    // Lock synchronously, before React renders the pending transition.
    busy = true
    refreshOnCompletion = false
    refresh()
  }

  return {
    start: scheduleNext,
    visibilityChanged() {
      cancel()
      if (isVisible()) requestRefresh()
      else refreshOnCompletion = false
    },
    setPending(pending: boolean) {
      if (stopped) return
      busy = pending
      if (pending) cancel()
      else if (refreshOnCompletion && isVisible()) requestRefresh()
      else scheduleNext()
    },
    stop() {
      stopped = true
      refreshOnCompletion = false
      cancel()
    }
  }
}
