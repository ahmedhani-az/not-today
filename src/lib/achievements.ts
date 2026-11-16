import { MILESTONES } from './content'
import { DAY, milestones, moneySaved, smokeFreeDays } from './progress'
import type { AppData, AppEvent, TriggerTag } from './types'

type Group = 'time' | 'cravings' | 'money' | 'triggers' | 'comeback' | 'health' | 'medicine'

const TIME_DAYS = [1, 3, 7, 14, 30, 90, 180, 365]
const CRAVES = [1, 10, 50, 100, 250]
const MONEY = [500, 1000, 5000, 10000]

export const BADGES: { id: string; group: Group }[] = [
  ...TIME_DAYS.map((n) => ({ id: `time-${n}d`, group: 'time' as const })),
  ...CRAVES.map((n) => ({ id: `crave-${n}`, group: 'cravings' as const })),
  ...MONEY.map((n) => ({ id: `money-${n}`, group: 'money' as const })),
  { id: 'money-reward', group: 'money' },
  { id: 'first-car', group: 'triggers' },
  { id: 'first-coffee', group: 'triggers' },
  { id: 'first-stress', group: 'triggers' },
  { id: 'comeback', group: 'comeback' },
  ...MILESTONES.map((m) => ({ id: `health-${m.id}`, group: 'health' as const })),
  { id: 'health-checks-4', group: 'health' },
  { id: 'med-7', group: 'medicine' },
  { id: 'med-course', group: 'medicine' },
]

export function earnedBadges(d: AppData, now: number): string[] {
  const s = d.settings
  const got: string[] = []
  const days = smokeFreeDays(d, now)
  const saved = moneySaved(d, now)
  const wins = d.events.filter((e) => e.type === 'win')
  const winWith = (tag: TriggerTag) => wins.some((e) => e.trigger === tag && e.at >= s.quitAt)
  const slips = d.events.filter((e) => e.type === 'slip' && e.at >= s.quitAt)
  const calm = (e: AppEvent) => now - e.at >= DAY && !slips.some((o) => o !== e && o.at > e.at && o.at <= e.at + DAY)

  TIME_DAYS.forEach((n) => days >= n && got.push(`time-${n}d`))
  CRAVES.forEach((n) => wins.length >= n && got.push(`crave-${n}`))
  MONEY.forEach((n) => saved >= n && got.push(`money-${n}`))
  if (s.reward.cost > 0 && saved >= s.reward.cost) got.push('money-reward')
  if (winWith('car')) got.push('first-car')
  if (winWith('coffee')) got.push('first-coffee')
  if (winWith('stress')) got.push('first-stress')
  if (slips.some(calm)) got.push('comeback')
  milestones(d, now).forEach((m) => m.reached && got.push(`health-${m.id}`))
  if (d.checks.length >= 4) got.push('health-checks-4')
  const doseDays = new Set(d.events.filter((e) => e.type === 'dose').map((e) => new Date(e.at).toDateString()))
  if (doseDays.size >= 7) got.push('med-7')
  return got
}

export function syncBadges(d: AppData, now: number): { data: AppData; fresh: string[] } {
  if (!d.settings.setupDone) return { data: d, fresh: [] } // a half-typed quit date must not earn badges
  const fresh = earnedBadges(d, now).filter((id) => !d.badges.includes(id))
  return { data: fresh.length ? { ...d, badges: [...d.badges, ...fresh] } : d, fresh }
}

export function nextBadge(d: AppData, now: number): string | null {
  const have = new Set([...d.badges, ...earnedBadges(d, now)])
  const open = BADGES.filter((b) => !have.has(b.id))
  return (open.find((b) => b.group === 'time') ?? open[0])?.id ?? null
}
