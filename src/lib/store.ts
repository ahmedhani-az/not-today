import { FAITH_DEFAULTS, MEDICINES } from './content'
import { suggestQuitDate } from './progress'
import type { AppData } from './types'

export const STORAGE_KEY = 'not-today'

export function defaultData(now: number): AppData {
  const quit = suggestQuitDate(now)
  return {
    version: 1,
    settings: {
      setupDone: false, lang: 'en', theme: 'light',
      cigsPerDay: 20, packPrice: 0, packSize: 20,
      quitAt: quit,
      reward: { name: '', cost: 0 },
      kidsReward: { name: '', cost: 0 },
      kids: [],
      myLine: 'I am stronger than a five-minute craving.',
      faithOn: true, intention: '', faithTexts: FAITH_DEFAULTS.map((f) => ({ ...f })),
      replacements: {},
      med: { plan: 'none', products: [], startAt: quit, schedule: {}, prices: {} },
      commute: [], sound: true, haptics: true,
    },
    events: [], badges: [], checks: [],
    game: { bonus: 0, stickers: [], level: 1, peak: 0, bestStage: 0, bestFruit: 0, missions: { date: '', ticked: [], chest: false, paid: [] } },
  }
}

const EVENT_TYPES = ['smoke', 'win', 'slip', 'dose']
type Rec = Record<string, unknown>
const isObj = (x: unknown): x is Rec => !!x && typeof x === 'object' && !Array.isArray(x)
const isNum = (x: unknown) => typeof x === 'number' && Number.isFinite(x)
const isStrs = (x: unknown) => Array.isArray(x) && x.every((v) => typeof v === 'string')

/** Validate a stored/imported backup, filling anything missing from the defaults. Null if unusable. */
export function parseImport(text: string, now = Date.now()): AppData | null {
  try {
    const d: unknown = JSON.parse(text)
    if (!isObj(d) || d.version !== 1 || !isObj(d.settings)) return null
    if (!Array.isArray(d.events) || !Array.isArray(d.badges) || !Array.isArray(d.checks)) return null
    if (!d.events.every((e) => isObj(e) && EVENT_TYPES.includes(e.type as string) && isNum(e.at) && (e.product === undefined || typeof e.product === 'string') && (e.slot === undefined || typeof e.slot === 'string'))) return null
    if (!d.checks.every((c) => isObj(c) && isNum(c.at))) return null
    if (!d.badges.every((b) => typeof b === 'string')) return null

    const def = defaultData(now).settings as unknown as Rec
    const s = d.settings
    const out: Rec = { ...def, ...s }
    for (const k of ['reward', 'kidsReward', 'med', 'replacements']) {
      if (s[k] !== undefined && !isObj(s[k])) return null
      out[k] = { ...(def[k] as Rec), ...(s[k] as Rec | undefined) }
    }
    const med = out.med as Rec
    for (const [o, k] of [[out, 'kids'], [out, 'faithTexts'], [out, 'commute'], [med, 'products']] as const) {
      if (!Array.isArray(o[k])) return null
    }
    // v0.1 kept one shared list in med.times: it moves to the first ticked product (or the plan's first product if none).
    if (med.times !== undefined) {
      if (!isStrs(med.times)) return null
      let first = (med.products as unknown[])[0]
      // nothing was ticked: the plan's first product takes the times, so the Medicine today card still appears
      if (first === undefined && med.plan !== 'none' && (med.times as string[]).length) {
        first = MEDICINES.find((m) => m.plan === med.plan)?.id
        if (first) med.products = [first]
      }
      if (!isObj(s.med) || !isObj((s.med as Rec).schedule)) med.schedule = typeof first === 'string' && (med.times as string[]).length ? { [first]: med.times } : {}
      delete med.times
    }
    if (!isObj(med.schedule) || !Object.values(med.schedule).every(isStrs)) return null
    if (typeof out.sound !== 'boolean' || typeof out.haptics !== 'boolean') return null
    if (!isObj(med.prices) || !isNum(out.quitAt) || !isNum(med.startAt)) return null
    if (!(out.kids as unknown[]).every((k) => isObj(k) && typeof k.name === 'string')) return null
    if (!(out.faithTexts as unknown[]).every((f) => isObj(f) && typeof f.ar === 'string' && typeof f.en === 'string')) return null
    out.kids = (out.kids as Rec[]).map((k) => ({
      ...k, note: typeof k.note === 'string' ? k.note : '',
      photo: typeof k.photo === 'string' && k.photo.startsWith('data:image/') ? k.photo : undefined,
    }))
    if (d.game !== undefined && !isObj(d.game)) return null
    const dg = defaultData(now).game
    const g = { ...dg, ...d.game } as Rec
    if (g.missions !== undefined && !isObj(g.missions)) return null
    const gm = { ...dg.missions, ...(g.missions as Rec) } as Rec
    g.missions = gm
    if (!isNum(g.bonus) || !isNum(g.level) || !isNum(g.peak) || !isNum(g.bestStage) || !isNum(g.bestFruit) || !isStrs(g.stickers)) return null
    if (typeof gm.date !== 'string' || typeof gm.chest !== 'boolean' || !isStrs(gm.ticked) || !isStrs(gm.paid)) return null
    return { ...d, settings: out, game: g } as unknown as AppData
  } catch {
    return null
  }
}

export function loadData(now: number): { data: AppData; corrupt: boolean } {
  let raw: string | null = null
  try { raw = localStorage.getItem(STORAGE_KEY) } catch { /* unreadable: treat as empty */ }
  if (raw === null) return { data: defaultData(now), corrupt: false }
  const data = parseImport(raw, now)
  if (data) return { data, corrupt: false }
  try { localStorage.setItem(STORAGE_KEY + '-corrupt', raw) } catch { /* nothing more to do */ }
  return { data: defaultData(now), corrupt: true }
}

export function saveData(data: AppData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

export const exportJson = (data: AppData): string => JSON.stringify(data, null, 2)
