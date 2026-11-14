/**
 * ScreenWake - Prevents screen from sleeping
 *
 * Strategy (from NoSleep.js):
 * 1. Use native Wake Lock API if available
 * 2. Re-acquire on visibility change (critical for iOS which releases on hide)
 * 3. Fall back to silent video loop for older browsers
 */

import { createSilentVideo } from './media'

export class ScreenWake {
  private wakeLock: WakeLockSentinel | null = null
  private video: HTMLVideoElement | null = null
  private enabled = false
  private useNativeWakeLock: boolean
  private requestVersion = 0

  constructor() {
    this.useNativeWakeLock = 'wakeLock' in navigator

    if (this.useNativeWakeLock) {
      // Re-acquire wake lock on visibility change (NoSleep.js pattern)
      document.addEventListener('visibilitychange', this.handleVisibilityChange)
      document.addEventListener('fullscreenchange', this.handleVisibilityChange)
    } else {
      // Fallback: create video element for older browsers
      this.video = createSilentVideo()
    }
  }

  private handleVisibilityChange = async (): Promise<void> => {
    // Re-acquire wake lock when page becomes visible again
    if (this.enabled && document.visibilityState === 'visible') {
      await this.enable()
    }
  }

  async enable(): Promise<void> {
    if (this.wakeLock && !this.wakeLock.released) return
    const version = ++this.requestVersion
    if (this.useNativeWakeLock) {
      try {
        const wakeLock = await navigator.wakeLock.request('screen')
        if (version !== this.requestVersion) {
          await wakeLock.release()
          return
        }
        this.wakeLock = wakeLock
        this.enabled = true
        console.log('[ScreenWake] Wake Lock acquired')

        this.wakeLock.addEventListener('release', () => {
          console.log('[ScreenWake] Wake Lock released')
        })
      } catch (err) {
        if (version !== this.requestVersion) return
        console.warn('[ScreenWake] Wake Lock failed:', err)
        this.enabled = false
      }
    } else if (this.video) {
      // Video fallback for browsers without Wake Lock API
      try {
        await this.video.play()
        if (version !== this.requestVersion) return
        this.enabled = true
        console.log('[ScreenWake] Video fallback started')
      } catch (err) {
        if (version !== this.requestVersion) return
        console.warn('[ScreenWake] Video fallback failed:', err)
        this.enabled = false
      }
    }
  }

  disable(): void {
    ++this.requestVersion
    if (this.useNativeWakeLock && this.wakeLock) {
      void this.wakeLock.release().catch(() => {})
      this.wakeLock = null
    } else if (this.video) {
      this.video.pause()
    }
    this.enabled = false
    console.log('[ScreenWake] Disabled')
  }

  isEnabled(): boolean {
    return this.enabled
  }

  destroy(): void {
    this.disable()
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    document.removeEventListener('fullscreenchange', this.handleVisibilityChange)
  }
}
