import { registerClientErrorTracking } from '@/lib/sentry-client'

// Synchronous listeners catch early errors; the SDK itself loads only after an exception.
registerClientErrorTracking()
