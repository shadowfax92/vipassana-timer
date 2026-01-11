/**
 * ReliableTimer - Background-safe timer using worker-timers
 *
 * Key features:
 * - Uses worker-timers (not throttled in background tabs)
 * - Time-based calculation (Date.now()) - not tick counting
 * - Visibility recovery - catches expired timers when tab resumes
 *
 * This solves the problem where browsers throttle setInterval to 1 call/minute
 * or completely pause JS when the tab is backgrounded or screen is locked.
 */

import { setInterval, clearInterval } from 'worker-timers'

export interface ReliableTimerOptions {
  onTick: (remainingSeconds: number) => void
  onComplete: () => void
  tickIntervalMs?: number
}

export class ReliableTimer {
  private endTime = 0
  private intervalId: number | null = null
  private running = false
  private options: ReliableTimerOptions

  constructor(options: ReliableTimerOptions) {
    this.options = options
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
  }

  start(durationSeconds: number): void {
    this.stop()

    // Store absolute end time - not tick count!
    // This is critical: even if ticks are missed, we know when the timer should end
    this.endTime = Date.now() + durationSeconds * 1000
    this.running = true

    console.log('[Timer] Started, ends at:', new Date(this.endTime).toLocaleTimeString())

    // Use worker-timers setInterval (not throttled in background)
    this.intervalId = setInterval(
      () => this.tick(),
      this.options.tickIntervalMs ?? 1000
    )

    // Immediate first tick to update UI
    this.tick()
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.running = false
    this.endTime = 0
  }

  getRemaining(): number {
    if (!this.running) return 0
    // Always calculate from wall clock - never trust tick count
    return Math.max(0, Math.ceil((this.endTime - Date.now()) / 1000))
  }

  isRunning(): boolean {
    return this.running
  }

  private tick(): void {
    const remaining = this.getRemaining()
    this.options.onTick(remaining)

    if (remaining <= 0) {
      this.stop()
      // Defer callback to avoid calling during interval execution
      setTimeout(() => this.options.onComplete(), 0)
    }
  }

  private handleVisibilityChange = (): void => {
    if (document.visibilityState !== 'visible' || !this.running) return

    console.log('[Timer] Visibility restored, checking timer...')
    const remaining = this.getRemaining()

    if (remaining <= 0) {
      // Timer expired while hidden - this is the key recovery mechanism
      console.log('[Timer] Expired while hidden, triggering complete')
      this.stop()
      setTimeout(() => this.options.onComplete(), 0)
    } else {
      // Force immediate tick to update UI with correct remaining time
      console.log('[Timer] Still running, remaining:', remaining)
      this.tick()
    }
  }

  destroy(): void {
    this.stop()
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
  }
}
