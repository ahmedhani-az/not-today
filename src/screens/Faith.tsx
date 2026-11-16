import { useState } from 'react'
import { faithRef } from '../lib/format'
import { t } from '../lib/i18n'
import type { FaithText } from '../lib/types'
import { dailyFaith } from './Home'
import type { ScreenProps } from './props'
import { Arabic, Page, TextField } from './ui'

const blank = (): FaithText => ({ id: `u-${Date.now()}`, ar: '', en: '', ref: '', kind: 'dua' })

export default function Faith({ data, update, go, now }: ScreenProps) {
  const s = data.settings
  const today = dailyFaith(data, now)
  const [editing, setEditing] = useState<FaithText | null>(null)
  const setTexts = (faithTexts: FaithText[]) => update((d) => ({ ...d, settings: { ...d.settings, faithTexts } }))
  const save = () => {
    if (!editing || !editing.ar.trim()) return
    const exists = s.faithTexts.some((f) => f.id === editing.id)
    setTexts(exists ? s.faithTexts.map((f) => (f.id === editing.id ? editing : f)) : [...s.faithTexts, editing])
    setEditing(null)
  }
  return (
    <Page title={t('tile.faith')} onBack={() => go('home')}>
      <section className="card">
        <TextField label={t('set.intention')} value={s.intention} multiline placeholder={t('set.intention.ph')}
          onChange={(v) => update((d) => ({ ...d, settings: { ...d.settings, intention: v } }))} />
      </section>
      {today && s.faithOn && (
        <section className="card center">
          <p className="eyebrow">{t('faith.today')}</p>
          <Arabic big>{today.ar}</Arabic>
          {s.lang === 'en' && <p>{today.en}</p>}
          {faithRef(today, s.lang) && <p className="muted">{faithRef(today, s.lang)}</p>}
        </section>
      )}
      <p className="note">{t('faith.ramadan')}</p>
      <p className="muted">{t('faith.norulings')}</p>
      <section className="card">
        <h2>{t('faith.list')}</h2>
        <ul className="faith-list">
          {s.faithTexts.map((f) => (
            <li key={f.id}>
              <Arabic>{f.ar}</Arabic>
              {s.lang === 'en' && <p>{f.en}</p>}
              <p className="muted">{faithRef(f, s.lang)}</p>
              <div className="row">
                <button className="btn ghost" onClick={() => setEditing({ ...f })}>{t('ui.edit')}</button>
                <button className="btn ghost" onClick={() => setTexts(s.faithTexts.filter((x) => x.id !== f.id))}>{t('ui.remove')}</button>
              </div>
            </li>
          ))}
        </ul>
        {editing ? (
          <div className="edit-box">
            <TextField label={t('faith.ar')} value={editing.ar} multiline onChange={(v) => setEditing({ ...editing, ar: v })} />
            <TextField label={t('faith.en')} value={editing.en} multiline onChange={(v) => setEditing({ ...editing, en: v })} />
            <TextField label={t('faith.ref')} value={editing.ref} onChange={(v) => setEditing({ ...editing, ref: v })} />
            <div className="row">
              <button className="btn primary" onClick={save}>{t('ui.save')}</button>
              <button className="btn ghost" onClick={() => setEditing(null)}>{t('ui.cancel')}</button>
            </div>
          </div>
        ) : (
          <button className="btn secondary" onClick={() => setEditing(blank())}>{t('faith.add')}</button>
        )}
      </section>
    </Page>
  )
}
