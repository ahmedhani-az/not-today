import { describe, expect, it } from 'vitest'
import { t, setLang } from './i18n'
import { buildReminders } from './notify'
import { DAY } from './progress'
import { defaultData } from './store'
import type { AppData, AppEvent } from './types'

const T = new Date(2026, 5, 1, 12, 0).getTime()
const base = (over: (d: AppData) => void = () => {}): AppData => {
  const d = defaultData(T)
  d.settings.quitAt = T
  over(d)
  return d
}
const smokes = (hour: number, n: number): AppEvent[] =>
  Array.from({ length: n }, (_, i) => ({ type: 'smoke', at: new Date(2026, 4, 10 + i, hour, 30).getTime(), trigger: 'coffee' }))
const meds = (rs: ReturnType<typeof buildReminders>) => rs.filter((r) => r.id >= 100 && r.id < 200)

describe('buildReminders', () => {
  it('plan none gives no medicine reminders', () => {
    expect(meds(buildReminders(base((d) => { d.settings.med.schedule = { champix: ['09:00'] } }), T))).toHaveLength(0)
  })
  it('one reminder per time, per product, and it names the product', () => {
    const d = base((x) => { x.settings.med.plan = 'nrt'; x.settings.med.schedule = { champix: ['08:00', '20:00'], 'invisi-patch': ['07:00'] } })
    const r = meds(buildReminders(d, T))
    expect(r.map((x) => [x.hour, x.minute, x.title.includes(t(`med.${x.hour === 7 ? 'invisi-patch' : 'champix'}.short`))])).toEqual([[8, 0, true], [20, 0, true], [7, 0, true]])
    expect(new Set(r.map((x) => x.id)).size).toBe(3)
    expect(r[2].title).toContain('Invisi')
  })
  it('names the product in Arabic too and never shows an amount', () => {
    setLang('ar')
    const d = base((x) => { x.settings.med.plan = 'nrt'; x.settings.med.schedule = { quickmist: ['10:00'] } })
    const [r] = meds(buildReminders(d, T))
    expect(r.title).toContain(t('med.quickmist.short'))
    expect(r.title + r.body).not.toMatch(/mg|مجم/)
    setLang('en')
  })
  it('ignores products it does not know', () => {
    const d = base((x) => { x.settings.med.plan = 'nrt'; x.settings.med.schedule = { mystery: ['10:00'] } })
    expect(meds(buildReminders(d, T))).toHaveLength(0)
  })
  it('coffee reminder runs 28 days after the quit date, then stops', () => {
    const has = (now: number) => buildReminders(base(), now).some((r) => r.id === 200)
    expect(has(T + DAY)).toBe(true)
    expect(has(T + 29 * DAY)).toBe(false)
  })
  it('coffee reminder waits for the quit date', () => {
    const d = base((x) => { x.settings.quitAt = T + 3 * DAY })
    expect(buildReminders(d, T).some((r) => r.id === 200)).toBe(false)
    expect(buildReminders(d, T + 3 * DAY).some((r) => r.id === 200)).toBe(true)
  })
  it('trigger reminders only after the quit date, at most 3', () => {
    const d = base((x) => {
      x.events = [...smokes(9, 3), ...smokes(11, 2), ...smokes(14, 2), ...smokes(16, 1)]
      x.settings.quitAt = T + DAY
    })
    const trig = (now: number) => buildReminders(d, now).filter((r) => r.id >= 300 && r.id < 400)
    expect(trig(T)).toHaveLength(0)
    expect(trig(T + 2 * DAY).length).toBeLessThanOrEqual(3)
    expect(trig(T + 2 * DAY).length).toBeGreaterThan(0)
  })
  it('a trigger at hour 9 reminds at 8:55 and names the replacement', () => {
    const d = base((x) => { x.events = smokes(9, 2); x.settings.replacements = { coffee: 'water' } })
    const r = buildReminders(d, T + DAY).find((x) => x.id >= 300 && x.id < 400)!
    expect([r.hour, r.minute]).toEqual([8, 55])
    expect(r.body).toContain('cold water')
  })
  it('hour 0 wraps to 23:55; commute and weekly check are included', () => {
    const d = base((x) => { x.events = smokes(0, 2); x.settings.commute = ['07:45'] })
    const rs = buildReminders(d, T + DAY)
    expect(rs.find((x) => x.id >= 300 && x.id < 400)).toMatchObject({ hour: 23, minute: 55 })
    expect(rs.find((x) => x.id >= 400 && x.id < 500)).toMatchObject({ hour: 7, minute: 45 })
    expect(rs.find((x) => x.id === 500)).toMatchObject({ weekday: 5, hour: 20, minute: 0 })
  })
  it('ignores malformed times', () => {
    const d = base((x) => { x.settings.med.plan = 'nrt'; x.settings.med.schedule = { champix: ['', 'abc'] } })
    expect(meds(buildReminders(d, T))).toHaveLength(0)
  })
})
