import type { ConnectionState, RealtimeChannel } from 'ably'

export type RealtimeAvailability = 'initializing' | 'available' | 'unavailable'

export function getRealtimeAvailability({
  connectionState,
  connectionErrorCode,
  subscriptionState = 'initializing'
}: {
  connectionState?: ConnectionState
  connectionErrorCode?: number
  subscriptionState?: RealtimeAvailability
}): RealtimeAvailability {
  if (!connectionState || connectionState === 'initialized' || connectionState === 'closing' || connectionState === 'closed') {
    return 'initializing'
  }

  // Token callback failures can leave Ably disconnected and retrying rather than failed.
  const authenticationFailed =
    connectionErrorCode === 80019 ||
    connectionErrorCode === 40170 ||
    connectionErrorCode === 40171 ||
    (connectionErrorCode !== undefined && connectionErrorCode >= 40140 && connectionErrorCode <= 40145 && connectionErrorCode !== 40142)

  if (
    connectionState === 'failed' ||
    connectionState === 'suspended' ||
    subscriptionState === 'unavailable' ||
    (connectionState === 'disconnected' && authenticationFailed)
  ) {
    return 'unavailable'
  }

  return connectionState === 'connected' && subscriptionState === 'available' ? 'available' : 'initializing'
}

export function subscribeToRealtimeUpdates(channel: RealtimeChannel, refresh: () => void, setState: (state: RealtimeAvailability) => void) {
  let disposed = false
  function initializing() {
    if (!disposed) setState('initializing')
  }
  function attached() {
    if (disposed) return
    setState('available')
    refresh()
  }
  function failed() {
    if (!disposed) setState('unavailable')
  }

  channel.on('attaching', initializing)
  channel.on('attached', attached)
  channel.on('failed', failed)
  channel.on('suspended', failed)
  void channel.subscribe('changed', refresh).then(attached).catch(failed)

  return () => {
    disposed = true
    channel.unsubscribe('changed', refresh)
    channel.off('attaching', initializing)
    channel.off('attached', attached)
    channel.off('failed', failed)
    channel.off('suspended', failed)
  }
}
