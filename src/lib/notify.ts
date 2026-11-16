import { Capacitor } from '@capacitor/core'
import { MEDICINES } from './content'
import { t } from './i18n'
import { DAY, topTriggers } from './progress'
import type { AppData, NotifyStatus } from './types'

export interface Reminder { id: number; title: string; body: string; hour: number; minute: number; weekday?: number; until?: number }
// weekday: JS getDay() (0 = Sunday). ids: 1xx medicine, 200 coffee, 3xx triggers, 4xx driving, 500 weekly check.

function hm(x: string): [number, number] | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(x)
  return m && +m[1] < 24 && +m[2] < 60 ? [+m[1], +m[2]] : null
}

export function buildReminders(d: AppData, now: number): Reminder[] {
  const s = d.settings
  const out: Reminder[] = []

  if (s.med.plan !== 'none') {
    let n = 0
    for (const { id } of MEDICINES) {
      for (const x of s.med.schedule[id] ?? []) {
        const at = hm(x)
        if (at) out.push({ id: 100 + n++, title: t('notif.med.title.named', { name: t(`med.${id}.short`) }), body: t('notif.med.body'), hour: at[0], minute: at[1] })
      }
    }
  }

  const until = s.quitAt + 28 * DAY
  if (now >= s.quitAt && now <= until) out.push({ id: 200, title: t('notif.coffee.title'), body: t('notif.coffee.body'), hour: 9, minute: 0, until })

  if (now >= s.quitAt) {
    topTriggers(d.events).slice(0, 3).forEach((x, i) => {
      const hour = (x.hour + 23) % 24
      out.push({
        id: 300 + i, hour, minute: 55,
        title: t('notif.trigger.title', { trigger: t(`trigger.${x.tag}`) }),
        body: t(`repl.${s.replacements[x.tag] ?? 'breathe'}`),
      })
    })
  }

  s.commute.forEach((x, i) => {
    const at = hm(x)
    if (at) out.push({ id: 400 + i, title: t('notif.commute.title'), body: t('notif.commute.body'), hour: at[0], minute: at[1] })
  })

  out.push({ id: 500, title: t('notif.check.title'), body: t('notif.check.body'), hour: 20, minute: 0, weekday: 5 })
  return out
}

let webTimer: number | undefined
let webList: Reminder[] = []
const fired = new Set<string>()

function webCheck() {
  const n = new Date()
  for (const r of webList) {
    if (r.hour !== n.getHours() || r.minute !== n.getMinutes()) continue
    if (r.weekday !== undefined && r.weekday !== n.getDay()) continue
    if (r.until !== undefined && n.getTime() > r.until) continue
    const key = `${r.id}-${n.toDateString()}-${r.hour}:${r.minute}`
    if (fired.has(key)) continue
    fired.add(key)
    try { new Notification(r.title, { body: r.body }) } catch { /* not allowed here */ }
  }
}

export async function scheduleAll(d: AppData, now: number): Promise<NotifyStatus> {
  const list = buildReminders(d, now)
  try {
    if (Capacitor.isNativePlatform()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const perm = await LocalNotifications.requestPermissions()
      if (perm.display !== 'granted') return 'denied'
      const pending = await LocalNotifications.getPending()
      if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications })
      // ponytail: `until` is enforced when the app next opens (the list is rebuilt then); native repeats have no end date.
      await LocalNotifications.schedule({
        notifications: list.map((r) => ({
          id: r.id, title: r.title, body: r.body, allowWhileIdle: true,
          schedule: { on: { hour: r.hour, minute: r.minute, ...(r.weekday !== undefined ? { weekday: r.weekday + 1 } : {}) } },
        })),
      })
      return 'ok'
    }
    if (typeof Notification === 'undefined') return 'unsupported'
    if (Notification.permission === 'default') await Notification.requestPermission()
    if (Notification.permission !== 'granted') return 'denied'
    webList = list
    if (webTimer === undefined) webTimer = window.setInterval(webCheck, 20_000)
    return 'ok'
  } catch {
    return 'unsupported'
  }
}
