import { useRef, useCallback, useState, useMemo, useEffect } from 'react'
import { ReliableTimer } from '../lib/ReliableTimer'

/**
 * React hook for meditation timer using ReliableTimer
 *
 * Improvements over the old setInterval approach:
 * - Uses worker-timers (not throttled in background tabs)
 * - Time-based calculation (Date.now()) - immune to timer drift
 * - Visibility recovery - catches expired timers when tab resumes
 */
export function useMeditationTimer(onComplete: () => void) {
  const [timeRemaining, setTimeRemaining] = useState(0)
  const timerRef = useRef<ReliableTimer | null>(null)
  const onCompleteRef = useRef(onComplete)

  // Keep onComplete ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // Initialize ReliableTimer
  useEffect(() => {
    timerRef.current = new ReliableTimer({
      onTick: setTimeRemaining,
      onComplete: () => onCompleteRef.current()
    })

    return () => timerRef.current?.destroy()
  }, [])

  const start = useCallback((minutes: number) => {
    const totalSeconds = minutes * 60
    setTimeRemaining(totalSeconds)
    timerRef.current?.start(totalSeconds)
  }, [])

  const stop = useCallback(() => {
    timerRef.current?.stop()
    setTimeRemaining(0)
  }, [])

  const isRunning = timerRef.current?.isRunning() ?? false

  const controls = useMemo(() => ({ start, stop }), [start, stop])

  return { controls, timeRemaining, isRunning }
}
