import { useState } from 'react'
import { t } from '../lib/i18n'
import { exportJson } from '../lib/store'
import type { AppData } from '../lib/types'
import { FaithFields, PeopleFields, QuitFields, SmokingFields, type Patch } from './fields'
import type { ScreenProps } from './props'
import ImportBox from './ImportBox'
import { Check, Page } from './ui'

export default function Settings({ data, update, go }: ScreenProps) {
  const s = data.settings
  const patch: Patch = (p) => update((d) => ({ ...d, settings: { ...d.settings, ...(typeof p === 'function' ? p(d.settings) : p) } }))
  const [pending, setPending] = useState<AppData | null>(null)
  const [msg, setMsg] = useState<'bad' | 'ok' | null>(null) // 'bad' here = could not apply; parse errors show inside ImportBox
  const [text, setText] = useState<string | null>(null)

  const download = () => {
    const url = URL.createObjectURL(new Blob([exportJson(data)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `not-today-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }
  const apply = () => {
    if (!pending) return
    try {
      update(() => pending)
      setPending(null); setMsg('ok'); go('home')
    } catch {
      setPending(null); setMsg('bad')
    }
  }

  return (
    <Page title={t('nav.settings')}>
      <section className="card">
        <h2>{t('settings.language')}</h2>
        <div className="chips">
          <button className={s.lang === 'en' ? 'chip on' : 'chip'} aria-pressed={s.lang === 'en'} onClick={() => patch({ lang: 'en' })}>English</button>
          <button className={s.lang === 'ar' ? 'chip on' : 'chip'} aria-pressed={s.lang === 'ar'} onClick={() => patch({ lang: 'ar' })}>العربية</button>
        </div>
        <h2>{t('settings.theme')}</h2>
        <div className="chips">
          <button className={s.theme === 'light' ? 'chip on' : 'chip'} aria-pressed={s.theme === 'light'} onClick={() => patch({ theme: 'light' })}>{t('theme.light')}</button>
          <button className={s.theme === 'dark' ? 'chip on' : 'chip'} aria-pressed={s.theme === 'dark'} onClick={() => patch({ theme: 'dark' })}>{t('theme.dark')}</button>
        </div>
        <h2>{t('settings.feedback')}</h2>
        <Check label={t('settings.sound')} checked={s.sound} onChange={(v) => patch({ sound: v })} />
        <p className="muted">{t('settings.sound.drive')}</p>
        <Check label={t('settings.haptics')} checked={s.haptics} onChange={(v) => patch({ haptics: v })} />
      </section>
      <section className="card"><h2>{t('setup.s1')}</h2><SmokingFields s={s} patch={patch} /></section>
      <section className="card"><h2>{t('setup.s2')}</h2><QuitFields s={s} patch={patch} /></section>
      <section className="card"><h2>{t('setup.s3')}</h2><PeopleFields s={s} patch={patch} /></section>
      <section className="card"><h2>{t('setup.s4')}</h2><FaithFields s={s} patch={patch} /></section>
      <section className="card">
        <h2>{t('settings.data')}</h2>
        <p className="muted">{t('settings.data.help')}</p>
        <button className="btn secondary wide" onClick={download}>{t('settings.export')}</button>
        <button className="btn ghost wide" onClick={() => setText(text === null ? exportJson(data) : null)}>{t('settings.export.show')}</button>
        {text !== null && (
          <div className="field">
            <label htmlFor="backup-text">{t('settings.export.label')}</label>
            <textarea id="backup-text" rows={6} readOnly value={text} onFocus={(e) => e.currentTarget.select()} />
          </div>
        )}
        <ImportBox onParsed={(d) => { setMsg(null); setPending(d) }} />
        {msg === 'bad' && <p className="warn" role="alert">{t('settings.import.bad')}</p>}
        {msg === 'ok' && <p className="ok" role="status">{t('settings.import.ok')}</p>}
        {pending && (
          <div className="note" role="alertdialog" aria-label={t('settings.import.confirm')}>
            <p>{t('settings.import.confirm')}</p>
            <div className="row">
              <button className="btn danger" onClick={apply}>{t('settings.import.yes')}</button>
              <button className="btn ghost" onClick={() => setPending(null)}>{t('ui.cancel')}</button>
            </div>
          </div>
        )}
      </section>
    </Page>
  )
}
