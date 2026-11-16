import { afterEach, describe, expect, it } from 'vitest'
import { BADGES } from './achievements'
import { LEVEL_NAMES, MEDICINES, MILESTONES, MISSIONS, REPLACEMENTS, STICKERS, TRIGGER_TAGS } from './content'
import { dict, setLang, t } from './i18n'

afterEach(() => setLang('en'))

describe('i18n', () => {
  it('ar has every en key and no empty strings', () => {
    for (const k of Object.keys(dict.en)) expect(dict.ar[k], k).toBeTruthy()
    for (const v of Object.values(dict.en)) expect(v).not.toBe('')
  })
  it('content keys exist', () => {
    const keys = [
      ...BADGES.flatMap((b) => [`badge.${b.id}.name`, `badge.${b.id}.how`]),
      ...MILESTONES.flatMap((m) => [`ms.${m.id}.title`, `ms.${m.id}.body`]),
      ...MEDICINES.flatMap((m) => ['name', 'type', 'note'].map((f) => `med.${m.id}.${f}`)),
      ...MEDICINES.flatMap((m) => [`med.${m.id}.when`, `med.${m.id}.short`]),
      ...LEVEL_NAMES.map((_, i) => `level.${i + 1}`),
      ...STICKERS.map((x) => `sticker.${x}`),
      ...MISSIONS.map((m) => `mission.${m.id}`),
      'med.follow', 'notif.med.title.named',
      ...TRIGGER_TAGS.map((x) => `trigger.${x}`),
      ...REPLACEMENTS.map((x) => `repl.${x}`),
      'med.line.prices', 'med.line.dose', 'med.line.champix', 'faith.ramadan', 'craving.slip.carryon',
    ]
    for (const k of keys) expect(dict.en[k], k).toBeTruthy()
  })
  it('no amounts in the new medicine text', () => {
    const keys = Object.keys(dict.en).filter((k) => /^med\.[a-z0-9-]+\.(when|short)$/.test(k) || k === 'med.follow')
    for (const l of ['en', 'ar'] as const) for (const k of keys) expect(dict[l][k], k).not.toMatch(/\d|mg|مجم|tablet|piece|قرص|حبة/i)
  })
  it('missing key returns the key', () => {
    expect(t('missing.key')).toBe('missing.key')
  })
  it('falls back to en and fills vars', () => {
    dict.en['test.only'] = 'Day {n}'
    setLang('ar')
    expect(t('test.only', { n: 3 })).toBe('Day 3')
    delete dict.en['test.only']
  })
  it('setLang sets dir and lang', () => {
    setLang('ar')
    expect(document.documentElement.dir).toBe('rtl')
    expect(document.documentElement.lang).toBe('ar')
    expect(t('trigger.car')).toBe(dict.ar['trigger.car'])
    setLang('en')
    expect(document.documentElement.dir).toBe('ltr')
  })
})
