/**
 * MediaKeepAlive - Enables audio playback from background/lock screen
 *
 * Uses MediaTick's source-swap technique:
 * - iOS/Android block NEW background audio playback
 * - But they permit SOURCE CHANGES on already-playing audio elements
 *
 * Strategy:
 * 1. Prime audio element with silent source at session start (user gesture)
 * 2. When timer completes, swap to real audio source
 * 3. Audio plays even from background because the element was already "playing"
 */

import { SILENT_MP3, createSilentAudio } from './media'

export class MediaKeepAlive {
  private silentAudio: HTMLAudioElement | null = null
  private primedAudio: HTMLAudioElement | null = null
  private active = false

  /**
   * Start keeping media session alive
   * MUST be called from user gesture (click/touch)
   */
  async start(): Promise<void> {
    if (this.active) return

    this.silentAudio = createSilentAudio()

    try {
      await this.silentAudio.play()
      this.active = true
      console.log('[MediaKeepAlive] Silent audio started')
    } catch (err) {
      console.error('[MediaKeepAlive] Failed to start:', err)
    }
  }

  /**
   * Prime an audio element for later source-swap
   * The primed element will be used for the outro audio
   */
  async primeForSwap(audioElement: HTMLAudioElement): Promise<void> {
    if (!this.active) {
      console.warn('[MediaKeepAlive] Call start() first')
      return
    }

    audioElement.src = SILENT_MP3
    audioElement.loop = true
    audioElement.volume = 0.01

    try {
      await audioElement.play()
      this.primedAudio = audioElement
      console.log('[MediaKeepAlive] Audio element primed for swap')
    } catch (err) {
      console.error('[MediaKeepAlive] Failed to prime:', err)
    }
  }

  /**
   * Swap source and play - works even from background!
   * This is the magic: the audio element is already "playing" silent audio,
   * so the browser allows us to change its source.
   *
   * Returns a promise that resolves when the audio finishes playing.
   */
  swapAndPlay(
    newSrc: string,
    options?: { loop?: boolean; volume?: number; fadeInSeconds?: number }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.primedAudio) {
        console.warn('[MediaKeepAlive] No primed audio element')
        resolve()
        return
      }

      const audio = this.primedAudio

      // The magic: swap source on already-playing element
      audio.src = newSrc
      audio.loop = options?.loop ?? false

      // Handle fade-in if requested
      const fadeInSeconds = options?.fadeInSeconds ?? 0
      if (fadeInSeconds > 0) {
        audio.volume = 0
      } else {
        audio.volume = options?.volume ?? 1.0
      }

      // Set up onended handler before loading
      audio.onended = () => {
        audio.onended = null
        resolve()
      }

      audio.onerror = () => {
        audio.onerror = null
        reject(new Error(`Failed to play ${newSrc}`))
      }

      audio.load()

      audio.play()
        .then(() => {
          console.log('[MediaKeepAlive] Source swapped and playing:', newSrc)

          // Apply fade-in after playback starts
          if (fadeInSeconds > 0) {
            const targetVolume = options?.volume ?? 1.0
            const steps = fadeInSeconds * 10 // 10 steps per second
            const volumeStep = targetVolume / steps
            let currentStep = 0

            const fadeInterval = window.setInterval(() => {
              currentStep++
              audio.volume = Math.min(targetVolume, currentStep * volumeStep)
              if (currentStep >= steps) {
                clearInterval(fadeInterval)
              }
            }, 100)
          }
        })
        .catch((err) => {
          console.error('[MediaKeepAlive] Swap failed:', err)
          reject(err)
        })
    })
  }

  stop(): void {
    if (this.silentAudio) {
      this.silentAudio.pause()
      this.silentAudio.src = ''
      this.silentAudio = null
    }

    if (this.primedAudio) {
      this.primedAudio.pause()
      this.primedAudio = null
    }

    this.active = false
    console.log('[MediaKeepAlive] Stopped')
  }

  isActive(): boolean {
    return this.active
  }
}
