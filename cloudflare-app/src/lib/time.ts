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
