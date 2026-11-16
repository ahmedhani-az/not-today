import { describe, expect, it } from 'vitest'
import { dict } from './i18n'

const files = import.meta.glob(['../**/*.ts', '../**/*.tsx', '!../**/*.test.*'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>

describe('ui copy', () => {
  it('every literal t()/tn() key used in src exists in both languages', () => {
    const missing: string[] = []
    for (const [f, src] of Object.entries(files)) {
      for (const m of src.matchAll(/\bt[n]?\(\s*'([\w.-]+)'/g)) {
        const k = m[1]
        const ok = (l: 'en' | 'ar') => dict[l][k] !== undefined || dict[l][`${k}.one`] !== undefined
        if (!ok('en') || !ok('ar')) missing.push(`${f}: ${k}`)
      }
    }
    expect(missing).toEqual([])
  })
})
