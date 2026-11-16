import { describe, expect, it } from 'vitest'
import { FAITH_DEFAULTS, MISSIONS, STICKERS, TREE_STAGES } from './content'
import * as G from './game'
import { DAY } from './progress'
import { defaultData } from './store'
import type { AppData, AppEvent } from './types'

const at = (d: number, h = 12, m = 0) => new Date(2026, 5, d, h, m).getTime()
const NOW = at(20)
const mk = (over: (d: AppData) => void = () => {}): AppData => {
  const d = defaultData(NOW)
  d.settings.quitAt = at(10, 0) // 10 full days by NOW (+12 h)
  d.settings.kids = []
  over(d)
  return d
}
const ev = (type: AppEvent['type'], when: number, extra: Partial<AppEvent> = {}): AppEvent => ({ type, at: when, ...extra })
const seq = (vals: number[]) => { let i = 0; return () => vals[Math.min(i++, vals.length - 1)] }

describe('points and levels', () => {
  it('uses the spec formula', () => {
    const d = mk((x) => {
      x.events = [ev('win', at(11)), ev('win', at(12)), ev('dose', at(11)), ev('smoke', at(1)), ev('slip', at(20, 1))]
      x.checks = [{ at: at(15), breathing: 3, cough: 3, sleep: 3, energy: 3, focus: 3 }]
      x.game.bonus = 7
    })
    // 10 days elapsed, slip today does not remove one
    expect(G.points(d, NOW)).toBe(50 * 2 + 20 * 1 + 40 * 1 + 100 * 10 + 7)
  })
  it('level boundaries', () => {
    const cases: [number, number][] = [[0, 1], [199, 1], [200, 2], [599, 2], [600, 3], [1199, 3], [1200, 4], [2000, 5], [100 * 10 * 9, 10], [100 * 11 * 10 - 1, 10], [100 * 11 * 10, 11]]
    for (const [p, l] of cases) expect(G.levelFor(p), String(p)).toBe(l)
  })
  it('level progress', () => {
    expect(G.levelProgress(0)).toEqual({ level: 1, into: 0, span: 200, pct: 0 })
    expect(G.levelProgress(300)).toEqual({ level: 2, into: 100, span: 400, pct: 25 })
    expect(G.levelProgress(1200)).toEqual({ level: 4, into: 0, span: 800, pct: 0 })
  })
})

describe('garden', () => {
  it('tree stage and next stage', () => {
    expect(TREE_STAGES).toEqual([0, 1, 3, 7, 14, 30, 90, 180, 365])
    const q = at(1, 0)
    const stage = (days: number) => G.treeStage(mk((x) => { x.settings.quitAt = q }), q + days * DAY)
    const exp: [number, number][] = [[0, 0], [1, 1], [2, 1], [3, 2], [6, 2], [7, 3], [13, 3], [14, 4], [29, 4], [30, 5], [89, 5], [90, 6], [179, 6], [180, 7], [364, 7], [365, 8], [900, 8]]
    for (const [days, s] of exp) expect(stage(days), `${days}d`).toBe(s)
    const d = mk((x) => { x.settings.quitAt = q })
    expect(G.nextTreeStage(d, q + 2 * DAY)).toEqual({ stage: 2, daysLeft: 1 })
    expect(G.nextTreeStage(d, q)).toEqual({ stage: 1, daysLeft: 1 })
    expect(G.nextTreeStage(d, q + 365 * DAY)).toBeNull()
  })
  it('flowers, fruit, visitors', () => {
    const d = mk((x) => { x.events = [ev('win', 1), ev('win', 2), ev('slip', 3), ev('smoke', 4)] })
    expect(G.flowerCount(d)).toBe(2)
    expect(G.fruitCount(d, NOW)).toBe(1) // 10 days
    expect(G.fruitCount(d, at(10, 0) + 6 * DAY)).toBe(0)
    expect(G.fruitCount(d, at(10, 0) + 14 * DAY)).toBe(2)
    expect(G.visitors(2)).toEqual({ butterfly: false, bird: false, bees: false })
    expect(G.visitors(3)).toEqual({ butterfly: true, bird: false, bees: false })
    expect(G.visitors(5)).toEqual({ butterfly: true, bird: true, bees: false })
    expect(G.visitors(7)).toEqual({ butterfly: true, bird: true, bees: true })
  })
  it('sky phases', () => {
    const p = (h: number, m = 0) => G.skyPhase(at(20, h, m))
    expect([p(4, 59), p(5), p(6, 59), p(7), p(16, 59), p(17), p(18, 59), p(19), p(23), p(0)]).toEqual(['night', 'dawn', 'dawn', 'day', 'day', 'dusk', 'dusk', 'night', 'night', 'night'])
  })
  it('flower layout is stable, bounded, capped', () => {
    expect(G.flowerLayout(0)).toEqual([])
    expect(G.flowerLayout(100)).toHaveLength(40)
    const a = G.flowerLayout(10), b = G.flowerLayout(25)
    expect(b.slice(0, 10)).toEqual(a)
    expect(G.flowerLayout(10)).toEqual(a)
    for (const f of b) {
      expect(f.x).toBeGreaterThanOrEqual(0); expect(f.x).toBeLessThanOrEqual(1)
      expect(f.y).toBeGreaterThanOrEqual(0); expect(f.y).toBeLessThanOrEqual(1)
      expect(Number.isInteger(f.kind)).toBe(true)
    }
    expect(new Set(b.map((f) => f.x)).size).toBeGreaterThan(20)
  })
})

describe('rewards', () => {
  const full = () => mk((x) => {
    x.settings.kids = [{ name: 'A', note: 'hi' }]
    x.settings.faithOn = true
  })
  // weights: kids 25, faith 25, points 25, health 15, sticker 10 (total 100)
  const kindAt = (d: AppData, r: number) => G.pickReward(d, NOW, seq([r, 0])).kind
  it('maps the roll to each kind by weight', () => {
    const d = full()
    expect([0, 0.2499].map((r) => kindAt(d, r))).toEqual(['kids', 'kids'])
    expect([0.25, 0.4999].map((r) => kindAt(d, r))).toEqual(['faith', 'faith'])
    expect([0.5, 0.7499].map((r) => kindAt(d, r))).toEqual(['points', 'points'])
    expect([0.75, 0.8999].map((r) => kindAt(d, r))).toEqual(['health', 'health'])
    expect([0.9, 0.9999].map((r) => kindAt(d, r))).toEqual(['sticker', 'sticker'])
  })
  it('details: faith text, points amount, sticker', () => {
    const d = full()
    const slipIds = FAITH_DEFAULTS.filter((f) => f.onSlip).map((f) => f.id)
    const ok = d.settings.faithTexts.filter((f) => !f.onSlip)
    const f0 = G.pickReward(d, NOW, seq([0.3, 0])) as { kind: 'faith'; textId: string }
    expect(f0.textId).toBe(ok[0].id)
    const f1 = G.pickReward(d, NOW, seq([0.3, 0.9999])) as { textId: string }
    expect(f1.textId).toBe(ok[ok.length - 1].id)
    expect(slipIds.length).toBeGreaterThan(0)
    for (const r of [0, 0.3, 0.6, 0.99]) for (const x of [0, 0.5, 0.99]) {
      const rw = G.pickReward(d, NOW, seq([r, x]))
      if (rw.kind === 'faith') expect(slipIds).not.toContain(rw.textId)
    }
    expect([0, 0.25, 0.5, 0.75, 0.9999].map((x) => (G.pickReward(d, NOW, seq([0.6, x])) as { amount: number }).amount)).toEqual([10, 20, 30, 50, 50])
    expect(G.pickReward(d, NOW, seq([0.95, 0]))).toEqual({ kind: 'sticker', id: STICKERS[0] })
    expect(G.pickReward(d, NOW, seq([0.95, 0.9999]))).toEqual({ kind: 'sticker', id: STICKERS[23] })
  })
  it('never picks kids when there are none', () => {
    const d = mk()
    for (let i = 0; i < 100; i++) expect(G.pickReward(d, NOW, () => i / 100).kind).not.toBe('kids')
  })
  it('kids only when a note or photo exists', () => {
    const d = mk((x) => { x.settings.kids = [{ name: 'A', note: '' }] })
    expect(kindAt(d, 0)).not.toBe('kids')
    const p = mk((x) => { x.settings.kids = [{ name: 'A', note: '', photo: 'data:image/png;base64,AA' }] })
    expect(kindAt(p, 0)).toBe('kids')
  })
  it('unavailable kinds are removed and the rest keep relative weights', () => {
    const d = mk((x) => { x.settings.faithOn = false }) // no kids note, no faith: points 25, health 15, sticker 10 = 50
    expect(kindAt(d, 0)).toBe('points')
    expect(kindAt(d, 0.4999)).toBe('points')
    expect(kindAt(d, 0.5)).toBe('health')
    expect(kindAt(d, 0.7999)).toBe('health')
    expect(kindAt(d, 0.8)).toBe('sticker')
  })
  it('faith needs a non-slip text', () => {
    const d = mk((x) => { x.settings.faithTexts = x.settings.faithTexts.filter((f) => f.onSlip) })
    expect(kindAt(d, 0)).toBe('points')
  })
  it('health is dropped when every milestone is reached', () => {
    const d = mk((x) => { x.settings.quitAt = NOW - 400 * DAY; x.settings.faithOn = false }) // points 25 + sticker 10 left
    expect(kindAt(d, 0.7)).toBe('points')
    expect(kindAt(d, 0.8)).toBe('sticker')
  })
  it('owning every sticker turns the sticker into points', () => {
    const d = full()
    d.game.stickers = [...STICKERS]
    const r = G.pickReward(d, NOW, seq([0.95, 0.5]))
    expect(r.kind).toBe('points')
  })
  it('owned stickers are not offered again', () => {
    const d = full()
    d.game.stickers = STICKERS.filter((s) => s !== 'acorn')
    expect(G.pickReward(d, NOW, seq([0.95, 0.5]))).toEqual({ kind: 'sticker', id: 'acorn' })
  })
  it('applyReward', () => {
    const d = full()
    expect(G.applyReward(d, { kind: 'points', amount: 30 }).game.bonus).toBe(30)
    expect(G.applyReward(d, { kind: 'sticker', id: 'bee' }).game.stickers).toEqual(['bee'])
    expect(G.applyReward(G.applyReward(d, { kind: 'sticker', id: 'bee' }), { kind: 'sticker', id: 'bee' }).game.stickers).toEqual(['bee'])
    for (const r of [{ kind: 'kids' }, { kind: 'faith', textId: 'x' }, { kind: 'health' }] as const) expect(G.applyReward(d, r)).toEqual(d)
    expect(d.game.bonus).toBe(0)
  })
  it('popBonus', () => {
    expect([0, 9, 10, 25, 199, 200, 5000, -4, NaN].map(G.popBonus)).toEqual([0, 0, 1, 2, 19, 20, 20, 0, 0])
  })
})

describe('missions', () => {
  const plan = (x: AppData) => { x.settings.med.plan = 'champix'; x.settings.med.products = ['champix']; x.settings.med.schedule = { champix: ['08:00', '20:00'] } }
  it('todayKey is local YYYY-MM-DD', () => {
    expect(G.todayKey(new Date(2026, 0, 5, 23, 59).getTime())).toBe('2026-01-05')
    expect(G.todayKey(new Date(2026, 11, 31, 0, 0).getTime())).toBe('2026-12-31')
  })
  it('three ids from the pool, stable for a date, different across dates', () => {
    const d = mk()
    const pool = MISSIONS.map((m) => m.id)
    const a = G.dailyMissions(d, at(20, 7))
    expect(a).toHaveLength(3)
    expect(new Set(a).size).toBe(3)
    for (const id of a) expect(pool).toContain(id)
    expect(G.dailyMissions(d, at(20, 23))).toEqual(a)
    const days = Array.from({ length: 14 }, (_, i) => G.dailyMissions(d, at(1 + i)).join())
    expect(new Set(days).size).toBeGreaterThan(3)
  })
  it('skips meds without a schedule and check unless due', () => {
    const d = mk()
    for (let i = 1; i <= 28; i++) {
      const m = G.dailyMissions(d, at(1 + (i % 28)))
      expect(m).not.toContain('meds')
      expect(m).toHaveLength(3)
    }
    // checks recent -> not due; check appears for some day when due
    const recent = mk((x) => { x.checks = [{ at: NOW - DAY, breathing: 3, cough: 3, sleep: 3, energy: 3, focus: 3 }] })
    for (let i = 20; i <= 25; i++) expect(G.dailyMissions(recent, at(i, 9))).not.toContain('check')
    expect(G.missionDone(recent, at(19, 20), 'check')).toBe(true) // done that day, so it stays in that day's list
    const due = mk(plan)
    const seen = new Set<string>()
    for (let i = 1; i <= 28; i++) G.dailyMissions(due, at(i, 9)).forEach((id) => seen.add(id))
    expect(seen.has('meds')).toBe(true)
    expect(seen.has('check')).toBe(true)
    const old = mk((x) => { x.checks = [{ at: NOW - 8 * DAY, breathing: 3, cough: 3, sleep: 3, energy: 3, focus: 3 }] })
    expect(Array.from({ length: 28 }, (_, i) => G.dailyMissions(old, at(1 + i, 9))).some((m) => m.includes('check'))).toBe(true)
  })
  it('plan none or empty schedule means no meds mission', () => {
    const d = mk((x) => { x.settings.med.schedule = { champix: ['08:00'] } }) // plan none
    for (let i = 1; i <= 28; i++) expect(G.dailyMissions(d, at(i))).not.toContain('meds')
  })
  it('fewer than three only when fewer apply', () => {
    const d = mk()
    expect(G.dailyMissions(d, NOW).length).toBe(3) // crave, break, water, walk apply
  })
  it('crave and break are auto from today\'s events', () => {
    const d = mk((x) => { x.events = [ev('win', at(19), { trigger: 'break' }), ev('win', at(20, 9), { trigger: 'car' })] })
    expect(G.missionDone(d, NOW, 'crave')).toBe(true)
    expect(G.missionDone(d, NOW, 'break')).toBe(false)
    expect(G.missionDone(mk((x) => { x.events = [ev('win', at(19))] }), NOW, 'crave')).toBe(false)
    const b = mk((x) => { x.events = [ev('win', at(20, 8), { trigger: 'break' })] })
    expect(G.missionDone(b, NOW, 'break')).toBe(true)
  })
  it('check is done by a check today', () => {
    const d = mk((x) => { x.checks = [{ at: at(20, 8), breathing: 3, cough: 3, sleep: 3, energy: 3, focus: 3 }] })
    expect(G.missionDone(d, NOW, 'check')).toBe(true)
    expect(G.missionDone(mk(), NOW, 'check')).toBe(false)
  })
  it('meds: every slot already due must have a dose', () => {
    const d = mk(plan)
    expect(G.missionDone(d, at(20, 7), 'meds')).toBe(false) // nothing due yet
    expect(G.missionDone(d, at(20, 9), 'meds')).toBe(false)
    const one = G.takeDose(d, at(20, 8, 5), 'champix', '08:00')
    expect(G.missionDone(one, at(20, 9), 'meds')).toBe(true)
    expect(G.missionDone(one, at(20, 21), 'meds')).toBe(false) // evening slot is due now
    expect(G.missionDone(G.takeDose(one, at(20, 20, 30), 'champix', '20:00'), at(20, 21), 'meds')).toBe(true)
  })
  it('self-ticked missions only count on the date they were ticked', () => {
    const d = mk()
    expect(G.missionDone(d, NOW, 'water')).toBe(false)
    const t = G.tickMission(d, NOW, 'water')
    expect(G.missionDone(t, NOW, 'water')).toBe(true)
    expect(G.missionDone(t, NOW, 'walk')).toBe(false)
    expect(G.missionDone(t, at(21), 'water')).toBe(false) // yesterday's disappear
    expect(G.tickMission(d, NOW, 'crave')).toEqual(d) // not self-ticked
    expect(G.tickMission(t, NOW, 'water')).toEqual(t) // once
  })
  it('missions credit 20 points once and never take them back', () => {
    const d = mk((x) => { x.events = [ev('win', at(20, 9))] })
    const s = G.settleMissions(d, NOW)
    const earned = G.dailyMissions(d, NOW).filter((id) => G.missionDone(d, NOW, id)).length
    expect(s.game.bonus).toBe(20 * earned)
    expect(G.settleMissions(s, NOW)).toEqual(s)
    expect(G.points(s, NOW)).toBe(G.points(d, NOW) + 20 * earned)
    // next day: bonus stays, points never fall
    expect(G.points(s, at(21))).toBeGreaterThanOrEqual(G.points(s, NOW))
    expect(G.settleMissions(s, at(21)).game.bonus).toBeGreaterThanOrEqual(s.game.bonus)
  })
  it('ticking pays immediately; day roll resets ticks and chest but keeps bonus', () => {
    const d = mk()
    // find a date whose missions include water
    let day = 1
    while (!G.dailyMissions(d, at(day)).includes('water')) day++
    const now = at(day)
    const t = G.tickMission(d, now, 'water')
    expect(t.game.bonus).toBe(20)
    expect(t.game.missions.date).toBe(G.todayKey(now))
    const next = G.tickMission(t, at(day + 1), 'walk')
    expect(next.game.bonus).toBeGreaterThanOrEqual(20)
    expect(next.game.missions.ticked).toEqual(['walk'])
    expect(next.game.missions.chest).toBe(false)
  })
  it('a done mission stays done and paid even if the plan changes the list', () => {
    const d = mk((x) => { x.events = [ev('win', at(20, 9))] })
    const s = G.settleMissions(d, NOW)
    if (G.dailyMissions(s, NOW).includes('crave')) expect(G.missionDone(s, NOW, 'crave')).toBe(true)
  })

  it('chest: ready only when all three are done, once per day', () => {
    const d0 = mk()
    expect(G.chestReady(d0, NOW)).toBe(false)
    // find a day where all three missions can be completed by the win-with-break + ticks
    let day = 1
    const ok = (id: string) => ['crave', 'break', 'water', 'walk'].includes(id)
    while (!G.dailyMissions(d0, at(day)).every(ok)) day++
    const now = at(day, 12)
    let d = mk((x) => { x.events = [ev('win', at(day, 9), { trigger: 'break' })] })
    for (const id of G.dailyMissions(d, now)) if (id === 'water' || id === 'walk') d = G.tickMission(d, now, id)
    d = G.settleMissions(d, now)
    expect(G.chestReady(d, now)).toBe(true)
    // no sticker: roll high
    const o = G.openChest(d, now, seq([0.99]))
    expect(o.sticker).toBeNull()
    expect(o.data.game.bonus).toBe(d.game.bonus + 50)
    expect(o.data.game.missions.chest).toBe(true)
    expect(G.chestReady(o.data, now)).toBe(false)
    const again = G.openChest(o.data, now, seq([0]))
    expect(again.data).toEqual(o.data)
    expect(again.sticker).toBeNull()
    // lucky roll: sticker
    const lucky = G.openChest(d, now, seq([0.2, 0]))
    expect(lucky.sticker).toBe(STICKERS[0])
    expect(lucky.data.game.stickers).toEqual([STICKERS[0]])
    expect(lucky.data.game.bonus).toBe(d.game.bonus + 50)
    // 1-in-3 edge
    expect(G.openChest(d, now, seq([0.3333, 0])).sticker).toBe(STICKERS[0])
    expect(G.openChest(d, now, seq([0.3334, 0])).sticker).toBeNull()
    // all stickers owned: none
    const owned = { ...d, game: { ...d.game, stickers: [...STICKERS] } }
    expect(G.openChest(owned, now, seq([0])).sticker).toBeNull()
    // next day the chest is closed again and not ready
    expect(G.chestReady(o.data, at(day + 1))).toBe(false)
  })
  it('chest cannot open when not ready', () => {
    const d = mk()
    expect(G.openChest(d, NOW, seq([0])).data).toEqual(d)
  })
})

describe('level sync', () => {
  it('raises and reports, never lowers', () => {
    const d = mk() // 1000 points -> level 3
    const r = G.syncLevel(d, NOW)
    expect(r.leveledTo).toBe(3)
    expect(r.data.game.level).toBe(3)
    expect(G.syncLevel(r.data, NOW)).toEqual({ data: r.data, leveledTo: null })
    const high = { ...r.data, game: { ...r.data.game, level: 9 } }
    expect(G.syncLevel(high, NOW)).toEqual({ data: high, leveledTo: null })
  })
})

describe('medicine', () => {
  const med = (x: AppData) => {
    x.settings.med.plan = 'nrt'
    x.settings.med.products = ['champix', 'invisi-patch']
    x.settings.med.schedule = { champix: ['20:00', '08:00'], 'invisi-patch': ['07:00'], quickmist: [] }
  }
  it('lists today\'s doses sorted by time', () => {
    const doses = G.todaysDoses(mk(med), at(20, 6))
    expect(doses.map((x) => [x.product, x.slot])).toEqual([['invisi-patch', '07:00'], ['champix', '08:00'], ['champix', '20:00']])
    expect(doses[0].at).toBe(at(20, 7))
    expect(doses.every((x) => !x.taken && x.onTime === null)).toBe(true)
  })
  it('nothing without a plan, and bad times are skipped', () => {
    expect(G.todaysDoses(mk(), NOW)).toEqual([])
    const d = mk((x) => { med(x); x.settings.med.schedule = { champix: ['xx', '25:00', '08:00'] } })
    expect(G.todaysDoses(d, NOW)).toHaveLength(1)
  })
  it('takeDose appends once, per product and slot', () => {
    const d = mk(med)
    const a = G.takeDose(d, at(20, 8, 10), 'champix', '08:00')
    expect(a.events.at(-1)).toEqual({ type: 'dose', at: at(20, 8, 10), product: 'champix', slot: '08:00' })
    expect(G.takeDose(a, at(20, 8, 20), 'champix', '08:00')).toEqual(a)
    const b = G.takeDose(a, at(20, 8, 20), 'invisi-patch', '07:00')
    expect(b.events.filter((e) => e.type === 'dose')).toHaveLength(2)
    expect(d.events).toHaveLength(0)
    // yesterday's dose does not block today's
    const y = G.takeDose(d, at(19, 8, 0), 'champix', '08:00')
    expect(G.takeDose(y, at(20, 8, 0), 'champix', '08:00').events.filter((e) => e.type === 'dose')).toHaveLength(2)
  })
  it('taken and on-time window is +/- 2 h inclusive', () => {
    const d = mk(med)
    const st = (h: number, m: number) => G.todaysDoses(G.takeDose(d, at(20, h, m), 'champix', '08:00'), at(20, 23)).find((x) => x.product === 'champix' && x.slot === '08:00')!
    expect(st(10, 0)).toMatchObject({ taken: true, onTime: true })
    expect(st(6, 0)).toMatchObject({ taken: true, onTime: true })
    expect(st(10, 1)).toMatchObject({ taken: true, onTime: false })
    expect(st(5, 59)).toMatchObject({ taken: false }) // more than 2 h early: refused
    expect(st(8, 0)).toMatchObject({ onTime: true })
    // other slot / product not marked
    const others = G.todaysDoses(G.takeDose(d, at(20, 8), 'champix', '08:00'), at(20, 9)).filter((x) => x.slot !== '08:00' || x.product !== 'champix')
    expect(others.every((x) => !x.taken)).toBe(true)
  })
  it('nextDose is the earliest untaken dose not yet passed', () => {
    const d = mk(med)
    expect(G.nextDose(d, at(20, 6))).toMatchObject({ product: 'invisi-patch', slot: '07:00' })
    const t = G.takeDose(d, at(20, 7), 'invisi-patch', '07:00')
    expect(G.nextDose(t, at(20, 7, 5))).toMatchObject({ product: 'champix', slot: '08:00' })
    expect(G.nextDose(t, at(20, 8))).toMatchObject({ slot: '08:00' }) // due exactly now still counts
    expect(G.nextDose(t, at(20, 8, 1))).toMatchObject({ slot: '20:00' }) // 08:00 is overdue, next upcoming is evening
    expect(G.nextDose(t, at(20, 21))).toBeNull()
    expect(G.nextDose(mk(), NOW)).toBeNull()
  })
})

describe('nothing is ever taken away', () => {
  it('adding a slip lowers nothing', () => {
    const d = mk((x) => {
      x.events = [ev('win', at(11)), ev('win', at(12)), ev('dose', at(12))]
      x.game = { bonus: 70, stickers: ['bee'], level: 2, peak: 0, bestStage: 0, bestFruit: 0, missions: { date: '', ticked: [], chest: false, paid: [] } }
    })
    const snap = (x: AppData, now: number) => [G.points(x, now), G.levelFor(G.points(x, now)), G.treeStage(x, now), G.flowerCount(x), G.fruitCount(x, now), x.game.stickers.length, x.game.bonus, G.syncLevel(x, now).data.game.level]
    for (const [now, slipAt] of [[NOW, NOW], [NOW, at(20, 11)], [at(40), at(40, 3)], [at(25, 3), at(25, 2)]] as const) {
      const before = snap(d, now)
      const after = snap({ ...d, events: [...d.events, ev('slip', slipAt, { count: 3 })] }, now)
      after.forEach((v, i) => expect(v, `${i} @${now}`).toBeGreaterThanOrEqual(before[i]))
    }
  })
  it('points never fall as time passes after a slip', () => {
    const d = mk((x) => { x.events = [ev('slip', at(20, 3))] })
    let prev = -1
    for (let h = 0; h < 24 * 30; h += 5) {
      const p = G.points(d, at(20, 0) + h * 3_600_000)
      expect(p).toBeGreaterThanOrEqual(prev)
      prev = p
    }
  })
})

describe('nothing shrinks when the quit date moves', () => {
  const big = () => mk((x) => {
    x.settings.quitAt = at(1, 0) - 99 * DAY // ~118 days by NOW
    x.events = Array.from({ length: 20 }, (_, i) => ev('win', at(1) + i))
  })
  const shown = (x: AppData) => [G.shownPoints(x, NOW), G.levelFor(G.shownPoints(x, NOW)), G.shownTreeStage(x, NOW), G.shownFruit(x, NOW)]
  it('moving quitAt forward lowers none of the shown values', () => {
    const d = G.syncLevel(big(), NOW).data
    const before = shown(d)
    expect(before[2]).toBeGreaterThanOrEqual(6)
    const moved = { ...d, settings: { ...d.settings, quitAt: NOW - 2 * DAY } }
    expect(G.points(moved, NOW)).toBeLessThan(G.points(d, NOW)) // the raw value does drop...
    const after = shown(G.syncLevel(moved, NOW).data)
    after.forEach((v, i) => expect(v, String(i)).toBeGreaterThanOrEqual(before[i]))
    expect(G.syncLevel(moved, NOW).data.game.level).toBeGreaterThanOrEqual(d.game.level)
    expect(G.syncLevel(moved, NOW).leveledTo).toBeNull()
  })
  it('syncLevel records peaks and only reports a real rise', () => {
    const r = G.syncLevel(big(), NOW)
    expect(r.data.game.peak).toBe(G.points(big(), NOW))
    expect(r.data.game.bestStage).toBe(G.treeStage(big(), NOW))
    expect(r.data.game.bestFruit).toBe(G.fruitCount(big(), NOW))
    expect(G.syncLevel(r.data, NOW)).toEqual({ data: r.data, leveledTo: null })
  })
  it('what grows next stays beyond the best stage', () => {
    const d = G.syncLevel(big(), NOW).data
    const moved = { ...d, settings: { ...d.settings, quitAt: NOW - 2 * DAY } }
    const best = d.game.bestStage
    const n = G.nextTreeStage(moved, NOW)!
    expect(n.stage).toBe(best + 1)
    expect(n.daysLeft).toBe(TREE_STAGES[best + 1] - 2)
  })
})

describe('doses: guards and as-needed', () => {
  const plan = (x: AppData) => { x.settings.med.plan = 'nrt'; x.settings.med.products = ['invisi-patch', 'quickmist']; x.settings.med.schedule = { 'invisi-patch': ['07:00', '20:00'], quickmist: [] } }
  it('a slot opens 2 hours before its time', () => {
    const d = mk(plan)
    const doses = (now: number) => G.todaysDoses(d, now).map((x) => x.open)
    expect(doses(at(20, 4, 59))).toEqual([false, false])
    expect(doses(at(20, 5, 0))).toEqual([true, false])
    expect(G.takeDose(d, at(20, 4, 59), 'invisi-patch', '07:00')).toBe(d)
    expect(G.takeDose(d, at(20, 5, 0), 'invisi-patch', '07:00').events).toHaveLength(1)
  })
  it('after midnight tonight\'s dose cannot be ticked', () => {
    const d = mk(plan)
    expect(G.takeDose(d, at(20, 0, 30), 'invisi-patch', '20:00')).toBe(d)
    expect(G.todaysDoses(d, at(20, 0, 30)).every((x) => !x.taken)).toBe(true)
  })
  it('a second dose of the same product within the same window is refused', () => {
    const d = mk((x) => { plan(x); x.settings.med.schedule['invisi-patch'] = ['08:00', '09:00'] })
    const a = G.takeDose(d, at(20, 8, 5), 'invisi-patch', '08:00')
    expect(G.takeDose(a, at(20, 9, 0), 'invisi-patch', '09:00')).toEqual(a)
    const far = mk((x) => { plan(x) })
    const b = G.takeDose(far, at(20, 7, 5), 'invisi-patch', '07:00')
    expect(G.takeDose(b, at(20, 20, 0), 'invisi-patch', '20:00').events).toHaveLength(2)
  })
  it('retiming a slot moves today\'s dose and keeps it taken', () => {
    const d = G.takeDose(mk(plan), at(20, 7, 5), 'invisi-patch', '07:00')
    const r = G.retimeDose(d, NOW, 'invisi-patch', '07:00', '07:30')
    expect(r.events[0]).toMatchObject({ product: 'invisi-patch', slot: '07:30', at: at(20, 7, 5) })
    const moved = { ...r, settings: { ...r.settings, med: { ...r.settings.med, schedule: { ...r.settings.med.schedule, 'invisi-patch': ['07:30', '20:00'] } } } }
    expect(G.todaysDoses(moved, at(20, 8)).find((x) => x.slot === '07:30')!.taken).toBe(true)
    expect(G.takeDose(moved, at(20, 8), 'invisi-patch', '07:30')).toEqual(moved)
    // other days and other products are left alone
    const y = { ...d, events: [...d.events, ev('dose', at(19, 7), { product: 'invisi-patch', slot: '07:00' })] }
    expect(G.retimeDose(y, NOW, 'invisi-patch', '07:00', '07:30').events[1].slot).toBe('07:00')
  })
  it('as-needed doses log without a slot and count for points', () => {
    const d = mk(plan)
    const a = G.takeAsNeeded(d, at(20, 13), 'quickmist')
    expect(a.events.at(-1)).toEqual({ type: 'dose', at: at(20, 13), product: 'quickmist' })
    expect(G.points(a, NOW)).toBe(G.points(d, NOW) + 20)
  })
  it('at most 6 as-needed doses count per calendar day, and the cap never lowers points', () => {
    let d = mk(plan)
    const base = G.points(d, NOW)
    let prev = base
    for (let i = 0; i < 9; i++) {
      d = G.takeAsNeeded(d, at(20, 8) + i * 60_000, 'quickmist')
      const p = G.points(d, NOW)
      expect(p).toBeGreaterThanOrEqual(prev)
      prev = p
    }
    expect(prev).toBe(base + 6 * 20)
    // a new calendar day counts afresh, and moving the clock past midnight changes nothing
    d = G.takeAsNeeded(d, at(21, 9), 'quickmist')
    expect(G.points(d, NOW)).toBe(base + 7 * 20)
    expect(G.points(d, at(22, 9)) - G.points(d, NOW)).toBe(100 * 2)
    // slotted doses are never capped
    let s = mk(plan)
    for (let i = 0; i < 8; i++) s = { ...s, events: [...s.events, ev('dose', at(20, 7, i), { product: 'invisi-patch', slot: '07:00' })] }
    expect(G.points(s, NOW)).toBe(G.points(mk(plan), NOW) + 8 * 20)
  })
})

describe('missions stay put through the day', () => {
  const plan = (x: AppData) => { x.settings.med.plan = 'champix'; x.settings.med.products = ['champix']; x.settings.med.schedule = { champix: ['08:00', '20:00'] } }
  it('adding or removing an inapplicable mission does not reorder the others', () => {
    for (let i = 1; i <= 28; i++) {
      const a = G.dailyMissions(mk(), at(i, 9)), b = G.dailyMissions(mk(plan), at(i, 9))
      const common = a.filter((id) => b.includes(id))
      expect(b.filter((id) => a.includes(id)), `day ${i}`).toEqual(common)
    }
  })
  it('a mission credited today stays in today\'s list when it stops applying', () => {
    let day = 1
    while (!G.dailyMissions(mk(plan), at(day, 21)).includes('meds')) day++
    let d = mk(plan)
    d = G.takeDose(G.takeDose(d, at(day, 8), 'champix', '08:00'), at(day, 20), 'champix', '20:00')
    d = G.settleMissions(d, at(day, 21))
    expect(d.game.missions.paid).toContain('meds')
    const off = { ...d, settings: { ...d.settings, med: { ...d.settings.med, plan: 'none' as const } } }
    expect(G.dailyMissions(off, at(day, 21))).toContain('meds')
    expect(G.dailyMissions(off, at(day + 1, 9))).not.toContain('meds')
  })
  it('the weekly check is due by calendar days', () => {
    const last = at(1, 23, 50)
    const d = mk((x) => { x.checks = [{ at: last, breathing: 3, cough: 3, sleep: 3, energy: 3, focus: 3 }] })
    expect(G.checkDue(d, at(8, 0, 10))).toBe(true) // 6 d 0 h 20 min later, but the 7th calendar day
    expect(G.checkDue(d, at(7, 23, 59))).toBe(false)
    expect(G.checkDue(d, at(1, 23, 55))).toBe(true) // done today keeps the mission
  })
})
