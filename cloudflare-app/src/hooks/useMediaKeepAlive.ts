import { useRef, useCallback, useEffect, useState } from 'react'
import { MediaKeepAlive } from '../lib/MediaKeepAlive'

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
  const keepAliveRef = useRef<MediaKeepAlive | null>(null)
  const outroAudioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize MediaKeepAlive and create audio element for outro
  useEffect(() => {
    keepAliveRef.current = new MediaKeepAlive()
    outroAudioRef.current = new Audio()
    outroAudioRef.current.setAttribute('playsinline', 'true')

    return () => keepAliveRef.current?.stop()
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
   * Stop the media keep-alive system
   */
  const stop = useCallback(() => {
    keepAliveRef.current?.stop()
    setIsActive(false)
  }, [])

  return { isActive, start, playOutro, stop }
}
