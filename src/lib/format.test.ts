import { afterEach, describe, expect, it } from 'vitest'
import { tn } from './format'
import { setLang } from './i18n'

afterEach(() => setLang('en'))

describe('tn', () => {
  it('english: one and other', () => {
    expect(tn('unit.days', 1)).toBe('1 day')
    expect(tn('unit.days', 5)).toBe('5 days')
  })
  it('arabic uses all plural categories', () => {
    setLang('ar')
    expect(tn('unit.days', 1)).toBe('يوم واحد')
    expect(tn('unit.days', 2)).toBe('يومان')
    expect(tn('unit.days', 5)).toBe('5 أيام')
    expect(tn('unit.days', 11)).toBe('11 يومًا')
    expect(tn('unit.days', 100)).toBe('100 يوم')
    expect(tn('unit.days', 0)).toBe('0 أيام')
  })
  it('every arabic plural key has all forms', () => {
    setLang('ar')
    for (const k of ['unit.days', 'unit.min', 'unit.hr', 'home.total', 'kids.days', 'myself.slip', 'trg.count']) {
      const forms = [1, 2, 5, 11, 100].map((n) => tn(k, n))
      expect(new Set(forms).size, k).toBe(5)
      forms.forEach((f) => expect(f).not.toBe(k))
    }
  })
})
