import { describe, expect, it } from 'vitest'
import { BADGES, earnedBadges, nextBadge, syncBadges } from './achievements'
import { DAY } from './progress'
import { defaultData } from './store'
import type { AppData, AppEvent } from './types'

const T = 1_800_000_000_000
function base(events: AppEvent[] = []): AppData {
  const d = defaultData(T)
  d.settings.cigsPerDay = 20
  d.settings.packPrice = 100
  d.settings.packSize = 20
  d.settings.setupDone = true
  d.settings.quitAt = T
  d.settings.med.startAt = T
  d.events = events
  return d
}
const has = (d: AppData, now: number, id: string) => earnedBadges(d, now).includes(id)
const wins = (n: number, trigger?: AppEvent['trigger']): AppEvent[] => Array.from({ length: n }, () => ({ type: 'win', at: T + 1000, trigger }))

describe('badges', () => {
  it('every id is unique and time badges come first', () => {
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length)
    expect(BADGES[0].group).toBe('time')
  })
  it('time', () => {
    const d = base()
    const days: [string, number][] = [['1d', 1], ['3d', 3], ['7d', 7], ['14d', 14], ['30d', 30], ['90d', 90], ['180d', 180], ['365d', 365]]
    for (const [id, n] of days) {
      expect(has(d, T + n * DAY, `time-${id}`)).toBe(true)
      expect(has(d, T + n * DAY - 1, `time-${id}`)).toBe(false)
    }
  })
  it('cravings', () => {
    for (const n of [1, 10, 50, 100, 250]) {
      expect(has(base(wins(n)), T, `crave-${n}`)).toBe(true)
      expect(has(base(wins(n - 1)), T, `crave-${n}`)).toBe(false)
    }
  })
  it('money', () => {
    const d = base() // 5 EGP per cigarette, 100 EGP per day
    for (const n of [500, 1000, 5000, 10000]) {
      expect(has(d, T + (n / 100) * DAY, `money-${n}`)).toBe(true)
      expect(has(d, T + (n / 100) * DAY - 1, `money-${n}`)).toBe(false)
    }
    d.settings.reward = { name: 'Trip', cost: 300 }
    expect(has(d, T + 3 * DAY, 'money-reward')).toBe(true)
    expect(has(d, T + 3 * DAY - 1, 'money-reward')).toBe(false)
    d.settings.reward.cost = 0
    expect(has(d, T + 30 * DAY, 'money-reward')).toBe(false)
  })
  it('trigger firsts need a post-quit win with that tag', () => {
    const d = base([{ type: 'win', at: T + 5, trigger: 'car' }, { type: 'win', at: T - 5, trigger: 'coffee' }])
    expect(has(d, T + DAY, 'first-car')).toBe(true)
    expect(has(d, T + DAY, 'first-coffee')).toBe(false)
    expect(has(d, T + DAY, 'first-stress')).toBe(false)
  })
  it('comeback needs 24h and no further slip', () => {
    const s: AppEvent = { type: 'slip', at: T + 1000, count: 1 }
    expect(has(base([s]), s.at + DAY - 3_600_000, 'comeback')).toBe(false)
    expect(has(base([s]), s.at + DAY, 'comeback')).toBe(true)
    expect(has(base([s, { ...s, at: s.at + 3_600_000 }]), s.at + DAY, 'comeback')).toBe(false)
  })
  it('health', () => {
    const d = base()
    expect(has(d, T + 20 * 60_000, 'health-hr')).toBe(true)
    expect(has(d, T + 20 * 60_000 - 1, 'health-hr')).toBe(false)
    expect(has(d, T + 365 * DAY, 'health-heart')).toBe(true)
    const four = [1, 2, 3, 4].map((i) => ({ at: T + i, breathing: 3, cough: 3, sleep: 3, energy: 3, focus: 3 }))
    d.checks = four.slice(0, 3)
    expect(has(d, T, 'health-checks-4')).toBe(false)
    d.checks = four
    expect(has(d, T, 'health-checks-4')).toBe(true)
  })
  it('medicine', () => {
    const dose = (i: number): AppEvent => ({ type: 'dose', at: new Date(2026, 0, 1 + i, 9).getTime() })
    const d = base([0, 1, 2, 3, 4, 5].flatMap((i) => [dose(i), dose(i)]))
    expect(has(d, T, 'med-7')).toBe(false)
    d.events.push(dose(6))
    expect(has(d, T, 'med-7')).toBe(true)
    d.settings.med.plan = 'champix'
    expect(has(d, T + 200 * DAY, 'med-course')).toBe(false) // only the "I finished" button awards it
  })
  it('syncBadges earns nothing until setup is done', () => {
    const d = base()
    d.settings.setupDone = false
    expect(syncBadges(d, T + 30 * DAY)).toEqual({ data: d, fresh: [] })
  })
  it('syncBadges keeps earned badges after a slip', () => {
    const d = base()
    const a = syncBadges(d, T + 7 * DAY)
    expect(a.data.badges).toContain('time-7d')
    expect(a.fresh).toContain('time-7d')
    const slipped = { ...a.data, events: [{ type: 'slip' as const, at: T + 2 * DAY, count: 1 }] }
    const b = syncBadges(slipped, T + 7 * DAY + 1000)
    expect(earnedBadges(slipped, T + 7 * DAY + 1000)).not.toContain('time-7d')
    expect(b.data.badges).toContain('time-7d')
    expect(b.fresh).not.toContain('time-7d')
    expect(syncBadges(b.data, T + 7 * DAY + 1000).fresh).toEqual([])
  })
  it('nextBadge', () => {
    expect(nextBadge(base(), T)).toBe('time-1d')
    expect(nextBadge(base(), T + 3 * DAY)).toBe('time-7d')
    expect(nextBadge(base(), T + 400 * DAY)).not.toMatch(/^time-/)
  })
})
