// Garden, rewards, missions and medicine doses. Pure: every function takes the data and `now`
// (and `rnd` where chance is involved); nothing here reads the clock or Math.random.
// Nothing is ever taken away: points, level and stickers only grow, a slip just adds nothing.
import { MISSIONS, STICKERS, TREE_STAGES } from './content'
import { sameDay } from './format'
import { cravingsBeaten, nextMilestone, smokeFreeDays } from './progress'
import type { AppData } from './types'


export type Reward =
  | { kind: 'kids' } | { kind: 'faith'; textId: string } | { kind: 'points'; amount: number }
  | { kind: 'health' } | { kind: 'sticker'; id: string }
export type Dose = { product: string; slot: string; at: number; taken: boolean; onTime: boolean | null; open: boolean }

const MISSION_POINTS = 20
const CHEST_POINTS = 50
const ON_TIME_MS = 2 * 3_600_000
const AS_NEEDED_PER_DAY = 6 // as-needed doses (no slot) that count for points each calendar day

// ---- points and levels ----

/**
 * Computed, never stored, except `game.bonus` (cards, chests, pops, missions).
 * Missions: each newly completed mission is credited into game.bonus once (settleMissions /
 * tickMission), tracked in game.missions.paid, so points can never fall when the day rolls over.
 */
export function points(d: AppData, now: number): number {
  const n = (t: string) => d.events.filter((e) => e.type === t).length
  const perDay = new Map<string, number>() // as-needed doses are capped per calendar day of the event, so the cap can never lower points
  let doses = 0
  for (const e of d.events) {
    if (e.type !== 'dose') continue
    if (e.slot !== undefined) { doses++; continue }
    const k = new Date(e.at).toDateString(), c = perDay.get(k) ?? 0
    if (c < AS_NEEDED_PER_DAY) doses++
    perDay.set(k, c + 1)
  }
  return 50 * n('win') + 20 * doses + 40 * d.checks.length + 100 * smokeFreeDays(d, now) + d.game.bonus
}

const levelStart = (n: number) => 100 * n * (n - 1)

export function levelFor(p: number): number {
  let n = Math.max(1, Math.floor((1 + Math.sqrt(1 + Math.max(0, p) / 25)) / 2))
  while (levelStart(n + 1) <= p) n++
  while (n > 1 && levelStart(n) > p) n--
  return n
}

export function levelProgress(p: number): { level: number; into: number; span: number; pct: number } {
  const level = levelFor(p)
  const into = p - levelStart(level)
  const span = levelStart(level + 1) - levelStart(level)
  return { level, into, span, pct: (into / span) * 100 }
}

// What the user sees is never below the best reached: moving the quit date can lower the live values, not these.
export const shownPoints = (d: AppData, now: number): number => Math.max(d.game.peak, points(d, now))
export const shownTreeStage = (d: AppData, now: number): number => Math.max(d.game.bestStage, treeStage(d, now))
export const shownFruit = (d: AppData, now: number): number => Math.max(d.game.bestFruit, fruitCount(d, now))

/** Raise the stored high-water marks (and level); reports a level only when it really rose. */
export function syncLevel(d: AppData, now: number): { data: AppData; leveledTo: number | null } {
  const peak = shownPoints(d, now), bestStage = shownTreeStage(d, now), bestFruit = shownFruit(d, now)
  const level = Math.max(d.game.level, levelFor(peak))
  const g = d.game
  if (level === g.level && peak === g.peak && bestStage === g.bestStage && bestFruit === g.bestFruit) return { data: d, leveledTo: null }
  return { data: { ...d, game: { ...g, level, peak, bestStage, bestFruit } }, leveledTo: level > g.level ? level : null }
}

// ---- garden ----

export function treeStage(d: AppData, now: number): number {
  const days = smokeFreeDays(d, now)
  return TREE_STAGES.reduce((s, from, i) => (days >= from ? i : s), 0)
}

export function nextTreeStage(d: AppData, now: number): { stage: number; daysLeft: number } | null {
  const s = shownTreeStage(d, now)
  return s >= TREE_STAGES.length - 1 ? null : { stage: s + 1, daysLeft: TREE_STAGES[s + 1] - smokeFreeDays(d, now) }
}

export const flowerCount = (d: AppData): number => cravingsBeaten(d)
export const fruitCount = (d: AppData, now: number): number => Math.floor(smokeFreeDays(d, now) / 7)
export const visitors = (level: number): { butterfly: boolean; bird: boolean; bees: boolean } =>
  ({ butterfly: level >= 3, bird: level >= 5, bees: level >= 7 })

export function skyPhase(now: number): 'dawn' | 'day' | 'dusk' | 'night' {
  const h = new Date(now).getHours()
  return h >= 5 && h < 7 ? 'dawn' : h >= 7 && h < 17 ? 'day' : h >= 17 && h < 19 ? 'dusk' : 'night'
}

// mulberry32: small seeded generator, so layouts and daily picks are stable.
function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Flower i always lands in the same place: x, y in 0..1, kind 0..4. Layout(n) is a prefix of layout(n+1). */
export function flowerLayout(n: number): { x: number; y: number; kind: number }[] {
  return Array.from({ length: Math.max(0, Math.min(40, Math.floor(n))) }, (_, i) => {
    const r = seeded(i * 7919 + 17)
    return { x: r(), y: r(), kind: Math.floor(r() * 5) }
  })
}

// ---- rewards ----

const pick = <T>(list: T[], r: number): T => list[Math.min(list.length - 1, Math.floor(r * list.length))]

/** Rolls: first `rnd()` picks the kind by weight, a second one picks the detail (text, amount, sticker). */
export function pickReward(d: AppData, now: number, rnd: () => number): Reward {
  const s = d.settings
  const texts = s.faithTexts.filter((f) => !f.onSlip)
  const left = STICKERS.filter((x) => !d.game.stickers.includes(x))
  const kinds: [Reward['kind'], number][] = [
    ...(s.kids.some((k) => k.note || k.photo) ? [['kids', 25] as [Reward['kind'], number]] : []),
    ...(s.faithOn && texts.length ? [['faith', 25] as [Reward['kind'], number]] : []),
    ['points', 25],
    ...(nextMilestone(d, now) ? [['health', 15] as [Reward['kind'], number]] : []),
    ['sticker', 10],
  ]
  let roll = rnd() * kinds.reduce((n, [, w]) => n + w, 0)
  const kind = (kinds.find(([, w]) => (roll -= w) < 0) ?? kinds[kinds.length - 1])[0]
  const points = (): Reward => ({ kind: 'points', amount: pick([10, 20, 30, 50], rnd()) })
  switch (kind) {
    case 'kids': return { kind }
    case 'health': return { kind }
    case 'faith': return { kind, textId: pick(texts, rnd()).id }
    case 'sticker': return left.length ? { kind, id: pick(left, rnd()) } : points()
    default: return points()
  }
}

export function applyReward(d: AppData, r: Reward): AppData {
  if (r.kind === 'points') return { ...d, game: { ...d.game, bonus: d.game.bonus + r.amount } }
  if (r.kind === 'sticker' && !d.game.stickers.includes(r.id)) return { ...d, game: { ...d.game, stickers: [...d.game.stickers, r.id] } }
  return d
}

/** 1 point per 10 pops, at most 20 per craving. */
export const popBonus = (pops: number): number => (pops > 0 ? Math.min(20, Math.floor(pops / 10)) : 0)

// ---- medicine ----

function slotTime(now: number, slot: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(slot)
  if (!m || +m[1] > 23 || +m[2] > 59) return null
  const n = new Date(now)
  return new Date(n.getFullYear(), n.getMonth(), n.getDate(), +m[1], +m[2]).getTime()
}

export function todaysDoses(d: AppData, now: number): Dose[] {
  const m = d.settings.med
  if (m.plan === 'none') return []
  const today = d.events.filter((e) => e.type === 'dose' && sameDay(e.at, now))
  const out: Dose[] = []
  for (const [product, slots] of Object.entries(m.schedule)) {
    for (const slot of slots) {
      const at = slotTime(now, slot)
      if (at === null) continue
      const e = today.find((x) => x.product === product && x.slot === slot)
      out.push({ product, slot, at, taken: !!e, onTime: e ? Math.abs(e.at - at) <= ON_TIME_MS : null, open: now >= at - ON_TIME_MS })
    }
  }
  return out.sort((a, b) => a.at - b.at || a.product.localeCompare(b.product))
}

/** The earliest untaken dose that is not yet past (a dose due exactly now counts). */
export const nextDose = (d: AppData, now: number): Dose | null => todaysDoses(d, now).find((x) => !x.taken && x.at >= now) ?? null

/** A slot can be ticked from 2 h before its time; a product gets one dose per slot window. */
export function takeDose(d: AppData, now: number, product: string, slot: string): AppData {
  const at = slotTime(now, slot)
  if (at === null || now < at - ON_TIME_MS) return d
  if (d.events.some((e) => e.type === 'dose' && e.product === product && sameDay(e.at, now) && (e.slot === slot || (e.slot !== undefined && Math.abs(e.at - at) <= ON_TIME_MS)))) return d
  return { ...d, events: [...d.events, { type: 'dose', at: now, product, slot }] }
}

/** A dose for a product with no fixed times (gums, spray): logged without a slot. */
export const takeAsNeeded = (d: AppData, now: number, product: string): AppData =>
  ({ ...d, events: [...d.events, { type: 'dose', at: now, product }] })

/** The user changed a slot's time: today's dose for it moves to the new slot, so it stays ticked. */
export function retimeDose(d: AppData, now: number, product: string, from: string, to: string): AppData {
  if (from === to || !d.events.some((e) => e.type === 'dose' && e.product === product && e.slot === from && sameDay(e.at, now))) return d
  return { ...d, events: d.events.map((e) => (e.type === 'dose' && e.product === product && e.slot === from && sameDay(e.at, now) ? { ...e, slot: to } : e)) }
}

// ---- missions ----

export const todayKey = (now: number): string => {
  const n = new Date(now)
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
}

/** A weekly self-check is due when none was done for 7 days; one done today keeps the mission (and its credit) for the day. */
export function checkDue(d: AppData, now: number): boolean {
  const last = Math.max(0, ...d.checks.map((c) => c.at))
  if (last === 0 || sameDay(last, now)) return true
  const l = new Date(last)
  return new Date(l.getFullYear(), l.getMonth(), l.getDate() + 7).getTime() <= now // calendar days: local midnight + 7 days
}

export function dailyMissions(d: AppData, now: number): string[] {
  // Shuffle the whole pool by the date, then filter: what applies changing later in the day cannot reshuffle the rest.
  const all = MISSIONS.map((m) => m.id)
  const r = seeded([...todayKey(now)].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261))
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]]
  }
  const paid = paidToday(d, now) // credited today stays in the list even if it stopped applying
  const ok = all.filter((id) => paid.includes(id) || (id === 'meds' ? todaysDoses(d, now).length > 0 : id === 'check' ? checkDue(d, now) : true))
  const picked = [...ok.filter((id) => paid.includes(id)), ...ok.filter((id) => !paid.includes(id))].slice(0, 3)
  return all.filter((id) => picked.includes(id))
}

/** Game state for today: yesterday's ticks, credits and chest are dropped (bonus is kept). */
function rolled(d: AppData, now: number): AppData {
  const date = todayKey(now)
  if (d.game.missions.date === date) return d
  return { ...d, game: { ...d.game, missions: { date, ticked: [], chest: false, paid: [] } } }
}

const paidToday = (d: AppData, now: number): string[] => (d.game.missions.date === todayKey(now) ? d.game.missions.paid ?? [] : [])

function doneNow(d: AppData, now: number, id: string): boolean {
  const today = (at: number) => sameDay(at, now)
  switch (id) {
    case 'crave': return d.events.some((e) => e.type === 'win' && today(e.at))
    case 'break': return d.events.some((e) => e.type === 'win' && e.trigger === 'break' && today(e.at))
    case 'check': return d.checks.some((c) => today(c.at))
    case 'meds': {
      const due = todaysDoses(d, now).filter((x) => x.at <= now)
      return due.length > 0 && due.every((x) => x.taken)
    }
    default: return d.game.missions.date === todayKey(now) && d.game.missions.ticked.includes(id)
  }
}

/** Done now, or already credited today (a done mission stays done). */
export const missionDone = (d: AppData, now: number, id: string): boolean => doneNow(d, now, id) || paidToday(d, now).includes(id)

/** Credit 20 bonus points for each of today's missions that is done and not yet credited. */
export function settleMissions(d: AppData, now: number): AppData {
  const r = rolled(d, now)
  const paid = r.game.missions.paid ?? []
  const fresh = dailyMissions(r, now).filter((id) => !paid.includes(id) && doneNow(r, now, id))
  if (!fresh.length) return r
  return { ...r, game: { ...r.game, bonus: r.game.bonus + MISSION_POINTS * fresh.length, missions: { ...r.game.missions, paid: [...paid, ...fresh] } } }
}

export function tickMission(d: AppData, now: number, id: string): AppData {
  if (!MISSIONS.some((m) => m.id === id && m.self)) return d
  const r = rolled(d, now)
  if (r.game.missions.ticked.includes(id)) return settleMissions(r, now)
  return settleMissions({ ...r, game: { ...r.game, missions: { ...r.game.missions, ticked: [...r.game.missions.ticked, id] } } }, now)
}

export function chestReady(d: AppData, now: number): boolean {
  if (d.game.missions.date === todayKey(now) && d.game.missions.chest) return false
  const list = dailyMissions(d, now)
  return list.length > 0 && list.every((id) => missionDone(d, now, id))
}

/** +50 bonus and a 1-in-3 chance (`rnd() < 1/3`) of a new sticker; once per day. */
export function openChest(d: AppData, now: number, rnd: () => number): { data: AppData; sticker: string | null } {
  if (!chestReady(d, now)) return { data: d, sticker: null }
  const s = settleMissions(d, now)
  const left = STICKERS.filter((x) => !s.game.stickers.includes(x))
  const sticker = rnd() < 1 / 3 && left.length ? pick(left, rnd()) : null
  const game = { ...s.game, bonus: s.game.bonus + CHEST_POINTS, stickers: sticker ? [...s.game.stickers, sticker] : s.game.stickers, missions: { ...s.game.missions, chest: true } }
  return { data: { ...s, game }, sticker }
}
