import { beforeEach, describe, expect, it, vi } from 'vitest'
import { STORAGE_KEY, defaultData, exportJson, loadData, parseImport, saveData } from './store'

const NOW = 1_800_000_000_000
beforeEach(() => localStorage.clear())

describe('store', () => {
  it('defaults', () => {
    const d = defaultData(NOW)
    expect(d.settings.kids).toEqual([])
    expect(d.settings.myLine).toBe('I am stronger than a five-minute craving.')
    expect(d.settings.setupDone).toBe(false)
  })
  it('round-trips', () => {
    const d = defaultData(NOW)
    d.settings.cigsPerDay = 12
    expect(saveData(d)).toBe(true)
    expect(loadData(NOW)).toEqual({ data: d, corrupt: false })
  })
  it('keeps corrupt raw string', () => {
    localStorage.setItem(STORAGE_KEY, '{bad')
    const r = loadData(NOW)
    expect(r.corrupt).toBe(true)
    expect(r.data).toEqual(defaultData(NOW))
    expect(localStorage.getItem('not-today-corrupt')).toBe('{bad')
  })
  it('rejects bad imports', () => {
    for (const s of ['[]', '{"version":2}', 'nope']) expect(parseImport(s)).toBeNull()
  })
  it('export/import round-trips', () => {
    const d = defaultData(NOW)
    expect(parseImport(exportJson(d))).toEqual(d)
  })
  it('imports partial settings with defaults filled', () => {
    const d = parseImport(JSON.stringify({ version: 1, settings: {}, events: [], badges: [], checks: [] }), NOW)!
    expect(d.settings).toEqual(defaultData(NOW).settings)
    const m = parseImport(JSON.stringify({ version: 1, settings: { med: { plan: 'nrt' }, cigsPerDay: 5 }, events: [], badges: [], checks: [] }), NOW)!
    expect(m.settings.med.plan).toBe('nrt')
    expect(m.settings.med.schedule).toEqual({})
    expect(m.settings.cigsPerDay).toBe(5)
  })
  it('rejects malformed pieces', () => {
    const mk = (o: object) => JSON.stringify({ version: 1, settings: {}, events: [], badges: [], checks: [], ...o })
    expect(parseImport(mk({ settings: { kids: 'x' } }))).toBeNull()
    expect(parseImport(mk({ settings: { faithTexts: {} } }))).toBeNull()
    expect(parseImport(mk({ events: [null] }))).toBeNull()
    expect(parseImport(mk({ events: [{ type: 'nope', at: 1 }] }))).toBeNull()
    expect(parseImport(mk({ events: [{ type: 'win', at: '1' }] }))).toBeNull()
    expect(parseImport(mk({ checks: [null] }))).toBeNull()
    expect(parseImport(mk({ badges: [1] }))).toBeNull()
    expect(parseImport(mk({ events: [{ type: 'win', at: 1 }], checks: [{ at: 2 }], badges: ['a'] }))).not.toBeNull()
  })
  it('drops kid photos that are not images', () => {
    const kids = [{ name: 'A', note: '', photo: 'javascript:1' }, { name: 'B', note: '', photo: 'data:image/jpeg;base64,AA' }]
    const d = parseImport(JSON.stringify({ version: 1, settings: { kids }, events: [], badges: [], checks: [] }))!
    expect(d.settings.kids.map((k) => k.photo)).toEqual([undefined, 'data:image/jpeg;base64,AA'])
  })
  it('loadData rejects partial stored data it cannot use', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, settings: {}, events: [null], badges: [], checks: [] }))
    expect(loadData(NOW).corrupt).toBe(true)
  })
  it('default quit date is local midnight', () => {
    const q = new Date(defaultData(NOW).settings.quitAt)
    expect([q.getHours(), q.getMinutes(), q.getSeconds(), q.getMilliseconds()]).toEqual([0, 0, 0, 0])
  })
  it('saveData false when storage throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    expect(saveData(defaultData(NOW))).toBe(false)
    spy.mockRestore()
  })

  describe('v0.2 migration', () => {
    const v01 = (over: Record<string, unknown> = {}, med: Record<string, unknown> = {}) => JSON.stringify({
      version: 1, events: [{ type: 'win', at: 5 }], badges: ['crave-1'], checks: [],
      settings: { cigsPerDay: 9, med: { plan: 'nrt', products: ['invisi-patch'], startAt: 7, times: ['07:30'], prices: { 'invisi-patch': 100 }, ...med }, ...over },
    })
    it('defaults for new fields', () => {
      const d = defaultData(NOW)
      expect(d.game).toEqual({ bonus: 0, stickers: [], level: 1, peak: 0, bestStage: 0, bestFruit: 0, missions: { date: '', ticked: [], chest: false, paid: [] } })
      expect([d.settings.sound, d.settings.haptics]).toEqual([true, true])
      expect(d.settings.med.schedule).toEqual({})
    })
    it('fills a missing game, sound and haptics', () => {
      const d = parseImport(v01(), NOW)!
      expect(d.game).toEqual(defaultData(NOW).game)
      expect([d.settings.sound, d.settings.haptics]).toEqual([true, true])
    })
    it('keeps stored sound/haptics/game', () => {
      const game = { bonus: 40, stickers: ['bee'], level: 2, missions: { date: '2026-01-01', ticked: ['walk'], chest: true } }
      const d = parseImport(v01({ sound: false, haptics: false }).replace('"events"', `"game":${JSON.stringify(game)},"events"`), NOW)!
      expect([d.settings.sound, d.settings.haptics]).toEqual([false, false])
      expect(d.game.bonus).toBe(40)
      expect(d.game.missions).toMatchObject({ date: '2026-01-01', ticked: ['walk'], chest: true })
    })
    it('moves old times to the first ticked product and removes times', () => {
      const d = parseImport(v01({}, { products: ['quickmist', 'invisi-patch'], times: ['07:30', '19:00'] }), NOW)!
      expect(d.settings.med.schedule).toEqual({ quickmist: ['07:30', '19:00'] })
      expect('times' in d.settings.med).toBe(false)
    })
    it('keeps old times when no product was ticked: the plan\'s first product gets them', () => {
      const d = parseImport(v01({}, { products: [] }), NOW)!
      expect(d.settings.med.products).toEqual(['invisi-patch'])
      expect(d.settings.med.schedule).toEqual({ 'invisi-patch': ['07:30'] })
      expect('times' in d.settings.med).toBe(false)
      const c = parseImport(v01({}, { plan: 'champix', products: [], times: ['08:00', '20:00'] }), NOW)!
      expect(c.settings.med).toMatchObject({ products: ['champix'], schedule: { champix: ['08:00', '20:00'] } })
      const none = parseImport(v01({}, { plan: 'none', products: [] }), NOW)!
      expect(none.settings.med.products).toEqual([])
      expect(none.settings.med.schedule).toEqual({})
    })
    it('missing peaks load as 0, present ones are kept, bad ones are refused', () => {
      const g = (game: unknown) => parseImport(JSON.stringify({ ...JSON.parse(v01()), game }), NOW)
      expect(g({ bonus: 1, level: 2, stickers: [] })!.game).toMatchObject({ peak: 0, bestStage: 0, bestFruit: 0 })
      expect(g({ bonus: 1, level: 2, stickers: [], peak: 900, bestStage: 4, bestFruit: 3 })!.game).toMatchObject({ peak: 900, bestStage: 4, bestFruit: 3 })
      expect(g({ bonus: 1, level: 2, stickers: [], peak: 'x' })).toBeNull()
    })
    it('an existing schedule wins over leftover times', () => {
      const d = parseImport(v01({}, { schedule: { champix: ['08:00'] } }), NOW)!
      expect(d.settings.med.schedule).toEqual({ champix: ['08:00'] })
    })
    it('v0.1 document keeps everything else and round-trips', () => {
      const d = parseImport(v01(), NOW)!
      expect(d.events).toEqual([{ type: 'win', at: 5 }])
      expect(d.badges).toEqual(['crave-1'])
      expect(d.settings.cigsPerDay).toBe(9)
      expect(d.settings.med).toEqual({ plan: 'nrt', products: ['invisi-patch'], startAt: 7, schedule: { 'invisi-patch': ['07:30'] }, prices: { 'invisi-patch': 100 } })
      expect(parseImport(exportJson(d), NOW)).toEqual(d)
      saveData(d)
      expect(loadData(NOW)).toEqual({ data: d, corrupt: false })
    })
    it('stays strict about wrong types', () => {
      const mk = (o: object) => JSON.stringify({ version: 1, settings: {}, events: [], badges: [], checks: [], ...o })
      expect(parseImport(mk({ game: 'x' }))).toBeNull()
      expect(parseImport(mk({ game: { bonus: '5' } }))).toBeNull()
      expect(parseImport(mk({ game: { stickers: [1] } }))).toBeNull()
      expect(parseImport(mk({ game: { level: null } }))).toBeNull()
      expect(parseImport(mk({ game: { missions: { ticked: 'a' } } }))).toBeNull()
      expect(parseImport(mk({ game: { missions: { chest: 1 } } }))).toBeNull()
      expect(parseImport(mk({ settings: { sound: 'yes' } }))).toBeNull()
      expect(parseImport(mk({ settings: { haptics: 0 } }))).toBeNull()
      expect(parseImport(mk({ settings: { med: { schedule: [] } } }))).toBeNull()
      expect(parseImport(mk({ settings: { med: { schedule: { a: 'x' } } } }))).toBeNull()
      expect(parseImport(mk({ settings: { med: { times: 'x' } } }))).toBeNull()
      expect(parseImport(mk({ events: [{ type: 'dose', at: 1, product: 3 }] }))).toBeNull()
      expect(parseImport(mk({ events: [{ type: 'dose', at: 1, product: 'champix', slot: '08:00' }] }))).not.toBeNull()
    })
  })
})
