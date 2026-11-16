import { MILESTONES } from './content'
import type { AppData, AppEvent, Settings, TriggerTag } from './types'

export const DAY = 86_400_000

export const elapsed = (d: AppData, now: number): number => Math.max(0, now - d.settings.quitAt)

export function smokeFreeDays(d: AppData, now: number): number {
  // A slip in today's unfinished period only stops that day from counting; the total never goes down.
  const done = Math.floor(elapsed(d, now) / DAY)
  const lost = new Set<number>()
  for (const e of d.events) {
    const i = Math.floor((e.at - d.settings.quitAt) / DAY)
    if (e.type === 'slip' && i >= 0 && i < done) lost.add(i)
  }
  return done - lost.size
}

export function cigsAvoided(d: AppData, now: number): number {
  const slipped = d.events.reduce((n, e) => (e.type === 'slip' && e.at >= d.settings.quitAt ? n + (e.count ?? 1) : n), 0)
  return Math.max(0, Math.floor((elapsed(d, now) / DAY) * d.settings.cigsPerDay) - slipped)
}

const perCig = (s: Settings): number => (s.packSize > 0 ? s.packPrice / s.packSize : 0)

export const moneySaved = (d: AppData, now: number): number => cigsAvoided(d, now) * perCig(d.settings)

export const monthlySaving = (s: Settings): number => s.cigsPerDay * 30 * perCig(s)

export const cravingsBeaten = (d: AppData): number => d.events.filter((e) => e.type === 'win').length

export function milestones(d: AppData, now: number): { id: string; pct: number; reached: boolean }[] {
  const el = elapsed(d, now)
  return MILESTONES.map((m) => {
    const pct = Math.min(1, el / m.ms) * 100
    return { id: m.id, pct, reached: pct >= 100 }
  })
}

export function overallRecovery(d: AppData, now: number): number {
  const ms = milestones(d, now)
  return Math.round(ms.reduce((n, m) => n + m.pct, 0) / ms.length)
}

export function nextMilestone(d: AppData, now: number): { id: string; msLeft: number } | null {
  const el = elapsed(d, now)
  const m = MILESTONES.find((x) => el < x.ms)
  return m ? { id: m.id, msLeft: m.ms - el } : null
}

export function topTriggers(events: AppEvent[]): { tag: TriggerTag; count: number; hour: number }[] {
  const by = new Map<TriggerTag, number[]>()
  for (const e of events) {
    if (e.type !== 'smoke') continue
    const tag = e.trigger ?? 'other'
    const hours = by.get(tag) ?? new Array(24).fill(0)
    hours[new Date(e.at).getHours()]++
    by.set(tag, hours)
  }
  return [...by].map(([tag, hours]) => ({
    tag,
    count: hours.reduce((a, b) => a + b, 0),
    hour: hours.indexOf(Math.max(...hours)),
  })).sort((a, b) => b.count - a.count)
}

export const courseDay = (s: Settings, now: number): number =>
  now < s.med.startAt ? 0 : Math.floor((now - s.med.startAt) / DAY) + 1

/** Local midnight `days` calendar days from `now` (DST-safe). */
export function midnightIn(now: number, days: number): number {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + days)
  return d.getTime()
}

export const suggestQuitDate = (now: number): number => midnightIn(now, 7)

/** A quit date is plausible unless it is more than 366 days back (typing a year passes through 1902). */
export const validQuitDate = (at: number, now: number): boolean => at >= midnightIn(now, 0) - 366 * DAY
