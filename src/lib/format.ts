import { DAY } from './progress'
import { FAITH_DEFAULTS } from './content'
import { getLang, t } from './i18n'
import type { FaithText, Kid, Lang } from './types'

const loc = (l: Lang) => (l === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US')
const safe = (n: number) => (Number.isFinite(n) ? Math.max(0, n) : 0)

export const fmtNum = (n: number, l: Lang) => new Intl.NumberFormat(loc(l), { maximumFractionDigits: 0 }).format(safe(n))
export const fmtMoney = (n: number, l: Lang) =>
  new Intl.NumberFormat(loc(l), { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(safe(n))
export const fmtDate = (ms: number, l: Lang, time = false) =>
  new Intl.DateTimeFormat(loc(l), time
    ? { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short', year: 'numeric' }).format(ms)

/** t() with plural forms `key.one/.two/.few/.many` picked by Intl.PluralRules; `key` itself is the "other" form. */
export function tn(key: string, n: number): string {
  let cat = new Intl.PluralRules(getLang()).select(n)
  if (cat === 'zero') cat = 'few'
  const k = `${key}.${cat}`
  const s = t(k, { n })
  return s !== k ? s : t(key, { n })
}

/** Reference line for a faith text; Arabic mode prefers refAr (also for older saved copies of the defaults). */
export function faithRef(f: FaithText, l: Lang): string {
  return l === 'ar' ? (f.refAr ?? FAITH_DEFAULTS.find((d) => d.id === f.id)?.refAr ?? f.ref) : f.ref
}

/** "20 min", "5 h", "3 days" */
export function fmtLeft(ms: number): string {
  const m = Math.max(1, Math.ceil(ms / 60_000))
  if (m < 60) return tn('unit.min', m)
  if (ms < 2 * DAY) return tn('unit.hr', Math.round(ms / 3_600_000))
  return tn('unit.days', Math.ceil(ms / DAY))
}

export function kidsTitle(kids: Kid[], l: Lang): string {
  const names = kids.map((k) => k.name.trim()).filter(Boolean)
  return names.length ? names.join(l === 'ar' ? ' و ' : ' & ') : t('tile.kids.fallback')
}

const pad = (n: number) => String(n).padStart(2, '0')
export const toDateInput = (ms: number) => {
  const d = new Date(ms)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
export function fromDateInput(v: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v)
  return m ? new Date(+m[1], +m[2] - 1, +m[3]).getTime() : null
}
export const sameDay = (a: number, b: number) => new Date(a).toDateString() === new Date(b).toDateString()

/** Is `at` within `mins` after any 'HH:MM' time today? */
export function withinAfter(times: string[], at: Date, mins: number): boolean {
  const cur = at.getHours() * 60 + at.getMinutes()
  return times.some((x) => {
    const [h, m] = x.split(':').map(Number)
    const diff = cur - (h * 60 + m)
    return Number.isFinite(diff) && diff >= 0 && diff <= mins
  })
}

/** Clock time such as 08:00 or 8:00 PM, shown with Latin digits in both languages. */
export const fmtTime = (ms: number, l: Lang) => new Intl.DateTimeFormat(loc(l), { hour: 'numeric', minute: '2-digit' }).format(ms)
