import { useRef, useCallback, useEffect, useState } from 'react'
import { MediaKeepAlive } from '../lib/MediaKeepAlive'
import type { AudioProgress } from '../types'

/**
 * React hook for enabling background audio playback
 *
 * Uses the source-swap technique from MediaTick:
 * - Prime an audio element at session start (from user gesture)
 * - Swap to real audio source when timer completes
 * - Audio plays even from background/lock screen
 *
 * This is specifically for the outro audio that needs to play
 * when the meditation timer completes, potentially from background.
 */
export function useMediaKeepAlive() {
  const [isActive, setIsActive] = useState(false)
  const [progress, setProgress] = useState<AudioProgress>({ current: 0, duration: 0 })
  const keepAliveRef = useRef<MediaKeepAlive | null>(null)
  const outroAudioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize MediaKeepAlive and create audio element for outro
  useEffect(() => {
    keepAliveRef.current = new MediaKeepAlive()
    outroAudioRef.current = new Audio()
    outroAudioRef.current.setAttribute('playsinline', 'true')

    // Set up progress callback
    keepAliveRef.current.setProgressCallback(setProgress)

    return () => {
      keepAliveRef.current?.setProgressCallback(null)
      keepAliveRef.current?.stop()
    }
  }, [])

  /**
   * Start the media keep-alive system
   * MUST be called from user gesture (e.g., start session button click)
   */
  const start = useCallback(async () => {
    await keepAliveRef.current?.start()
    if (outroAudioRef.current) {
      await keepAliveRef.current?.primeForSwap(outroAudioRef.current)
    }
    setIsActive(keepAliveRef.current?.isActive() ?? false)
  }, [])

  /**
   * Play audio using the source-swap technique
   * Works even from background/lock screen
   */
  const playOutro = useCallback(
    async (outroSrc: string, options?: { loop?: boolean; fadeInSeconds?: number }) => {
      await keepAliveRef.current?.swapAndPlay(outroSrc, options)
    },
    []
  )

  /**
   * Stop current playback but keep element primed for next track
   * Use when skipping a phase but needing to play another outro phase
   */
  const stopPlayback = useCallback(() => {
    keepAliveRef.current?.stopPlayback()
  }, [])

  /**
   * Fully stop the media keep-alive system
   * Use when session ends
   */
  const stop = useCallback(() => {
    keepAliveRef.current?.stop()
    setIsActive(false)
    setProgress({ current: 0, duration: 0 })
  }, [])

  const timeRemaining = Math.max(0, Math.ceil(progress.duration - progress.current))

  return { isActive, progress, timeRemaining, start, playOutro, stopPlayback, stop }
}
