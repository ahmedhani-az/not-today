import { describe, expect, it } from 'vitest'
import { DAY, cigsAvoided, courseDay, cravingsBeaten, monthlySaving, milestones, moneySaved, nextMilestone, overallRecovery, smokeFreeDays, suggestQuitDate, topTriggers, validQuitDate, midnightIn } from './progress'
import { defaultData } from './store'
import type { AppData, AppEvent } from './types'

const T = 1_800_000_000_000
function fixture(events: AppEvent[] = [], packSize = 20): AppData {
  const d = defaultData(T)
  d.settings.cigsPerDay = 20
  d.settings.packPrice = 100
  d.settings.packSize = packSize
  d.settings.quitAt = T
  d.events = events
  return d
}
const slip = (day: number, count: number): AppEvent => ({ type: 'slip', at: T + day * DAY + 1000, count })

describe('progress', () => {
  it('no slips', () => {
    const d = fixture()
    const now = T + 10 * DAY
    expect(smokeFreeDays(d, now)).toBe(10)
    expect(cigsAvoided(d, now)).toBe(200)
    expect(moneySaved(d, now)).toBe(1000)
    expect(monthlySaving(d.settings)).toBe(3000)
  })
  it('slips on the same day cost one day', () => {
    const d = fixture([slip(2, 3), slip(2, 1)])
    expect(smokeFreeDays(d, T + 10 * DAY)).toBe(9)
    expect(cigsAvoided(d, T + 10 * DAY)).toBe(196)
  })
  it('slip does not reduce cravings beaten', () => {
    const d = fixture([{ type: 'win', at: T }, { type: 'win', at: T }, slip(1, 1)])
    expect(cravingsBeaten(d)).toBe(2)
  })
  it('before quit date everything is 0', () => {
    const d = fixture([slip(-1, 2)])
    const now = T - 3 * DAY
    expect(smokeFreeDays(d, now)).toBe(0)
    expect(cigsAvoided(d, now)).toBe(0)
    expect(moneySaved(d, now)).toBe(0)
    expect(overallRecovery(d, now)).toBe(0)
    expect(milestones(d, now).every((m) => m.pct === 0 && !m.reached)).toBe(true)
    expect(courseDay(d.settings, T - 3 * DAY)).toBe(0)
  })
  it('floors at zero', () => {
    const d = fixture([slip(1, 500)])
    expect(cigsAvoided(d, T + 10 * DAY)).toBe(0)
    expect(moneySaved(d, T + 10 * DAY)).toBe(0)
  })
  it('packSize 0 is not NaN', () => {
    const d = fixture([], 0)
    expect(moneySaved(d, T + 10 * DAY)).toBe(0)
    expect(monthlySaving(d.settings)).toBe(0)
  })
  it('milestones at 12h', () => {
    const d = fixture()
    const m = Object.fromEntries(milestones(d, T + DAY / 2).map((x) => [x.id, x]))
    expect(m.hr.pct).toBe(100)
    expect(m.hr.reached).toBe(true)
    expect(m.co.pct).toBe(100)
    expect(m.co.reached).toBe(true)
    expect(m.heart.pct).toBeCloseTo(0.14, 2)
    expect(nextMilestone(d, T + DAY / 2)?.id).toBe('circulation')
    expect(nextMilestone(d, T + 400 * DAY)).toBeNull()
  })
  it('topTriggers orders by count with modal hour', () => {
    const at = (h: number) => new Date(2026, 0, 5, h).getTime()
    const ev: AppEvent[] = [
      { type: 'smoke', at: at(9), trigger: 'coffee' }, { type: 'smoke', at: at(9), trigger: 'coffee' }, { type: 'smoke', at: at(14), trigger: 'coffee' },
      { type: 'smoke', at: at(20), trigger: 'car' },
      { type: 'win', at: at(9), trigger: 'car' },
    ]
    expect(topTriggers(ev)).toEqual([{ tag: 'coffee', count: 3, hour: 9 }, { tag: 'car', count: 1, hour: 20 }])
  })
  it('courseDay and suggestQuitDate', () => {
    const d = fixture()
    d.settings.med.startAt = T
    expect(courseDay(d.settings, T + 1000)).toBe(1)
    expect(courseDay(d.settings, T + DAY)).toBe(2)
    const q = new Date(suggestQuitDate(T))
    expect([q.getHours(), q.getMinutes()]).toEqual([0, 0])
    expect(suggestQuitDate(T)).toBe(midnightIn(T, 7))
    expect(suggestQuitDate(T) - T).toBeGreaterThan(6 * DAY)
    expect(suggestQuitDate(T) - T).toBeLessThanOrEqual(7 * DAY + 3_600_000)
  })
  it('validQuitDate ignores dates more than 366 days back', () => {
    expect(validQuitDate(new Date(1902, 0, 1).getTime(), T)).toBe(false)
    expect(validQuitDate(T - 400 * DAY, T)).toBe(false)
    expect(validQuitDate(T - 30 * DAY, T)).toBe(true)
    expect(validQuitDate(T + 30 * DAY, T)).toBe(true)
  })
})

describe('slip never lowers the day count', () => {
  it('a slip today keeps the total, then that day does not count', () => {
    const d = fixture([slip(10, 1)])
    expect(smokeFreeDays(d, T + 10 * DAY + 2000)).toBe(10)
    expect(smokeFreeDays(d, T + 11 * DAY)).toBe(10)
    expect(smokeFreeDays(d, T + 12 * DAY)).toBe(11)
  })
  it('pre-quit slips do not cost money', () => {
    const d = fixture([{ type: 'slip', at: T - DAY, count: 5 }])
    expect(cigsAvoided(d, T + DAY)).toBe(20)
  })
})
