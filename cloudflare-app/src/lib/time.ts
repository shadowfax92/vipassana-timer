export function formatCountdown(seconds: number): string {
  const whole = Math.max(0, Math.ceil(seconds))
  return `${Math.floor(whole / 60).toString().padStart(2, '0')}:${(whole % 60).toString().padStart(2, '0')}`
}
export function formatDuration(seconds: number): string {
  return `${Math.ceil(seconds / 60)} min`
}
export function formatClock(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(timestamp)
}
export function formatFinish(timestamp: number, now: number): string {
  const day = new Date(now)
  day.setDate(day.getDate() + 1)
  const tomorrow = day.toDateString() === new Date(timestamp).toDateString()
  return `${tomorrow ? 'Tomorrow, ' : ''}${formatClock(timestamp)}`
}

/** Round cumulative boundaries so displayed parts still add up to the total.
 * Rounding every recording upward independently would invent extra seconds. */
export function roundDurations(seconds: readonly number[]): number[] {
  // Audio metadata has microsecond precision. Normalize sums at that precision
  // before rounding up, so 3600.000000000001 does not display as 3601 seconds.
  const wholeSeconds = (value: number) => Math.ceil(Math.round(value * 1_000_000) / 1_000_000)
  let elapsed = 0
  return seconds.map(duration => {
    const start = elapsed
    elapsed += duration
    return wholeSeconds(elapsed) - wholeSeconds(start)
  })
}
