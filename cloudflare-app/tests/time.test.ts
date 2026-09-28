import { expect, it } from 'vitest'
import { formatClock, formatCountdown, formatFinish } from '../src/lib/time'

it('formats fractional and negative progress safely', () => {
  expect(formatCountdown(92.835)).toBe('01:33')
  expect(formatCountdown(-0.1)).toBe('00:00')
  expect(formatCountdown(3600)).toBe('60:00')
})
it('marks a finish on the next local day, including month boundaries', () => {
  const now = new Date(2026, 8, 30, 23, 30).getTime()
  const finish = now + 60 * 60 * 1000
  expect(formatFinish(finish, now)).toBe('Tomorrow, ' + formatClock(finish))
  expect(formatFinish(now + 10 * 60 * 1000, now)).toBe(formatClock(now + 10 * 60 * 1000))
})
