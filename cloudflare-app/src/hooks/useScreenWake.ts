import { useRef, useCallback, useEffect, useState } from 'react'
import { ScreenWake } from '../lib/ScreenWake'
import type { SessionPhase } from '../types'

/**
 * React hook for preventing screen sleep during meditation sessions
 *
 * Features:
 * - Auto-enables during active session phases
 * - Auto-disables when session is idle or complete
 * - Re-acquires wake lock on visibility changes (handled by ScreenWake class)
 * - Falls back to video loop on browsers without Wake Lock API
 */
export function useScreenWake(phase: SessionPhase) {
  const [isEnabled, setIsEnabled] = useState(false)
  const screenWakeRef = useRef<ScreenWake | null>(null)

  // Initialize ScreenWake instance
  useEffect(() => {
    screenWakeRef.current = new ScreenWake()
    return () => screenWakeRef.current?.destroy()
  }, [])

  // Auto-enable during active session phases
  useEffect(() => {
    const isActive = phase !== 'idle' && phase !== 'complete'

    if (isActive) {
      screenWakeRef.current?.enable().then(() => {
        setIsEnabled(screenWakeRef.current?.isEnabled() ?? false)
      })
    } else {
      screenWakeRef.current?.disable()
      setIsEnabled(false)
    }
  }, [phase])

  // Manual request (for explicit user control if needed)
  const request = useCallback(async () => {
    await screenWakeRef.current?.enable()
    setIsEnabled(screenWakeRef.current?.isEnabled() ?? false)
  }, [])

  // Manual release
  const release = useCallback(() => {
    screenWakeRef.current?.disable()
    setIsEnabled(false)
  }, [])

  return { isEnabled, request, release }
}
