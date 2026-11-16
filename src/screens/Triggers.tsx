import { useState } from 'react'
import { REPLACEMENTS, TRIGGER_TAGS } from '../lib/content'
import { tn } from '../lib/format'
import { t } from '../lib/i18n'
import { topTriggers } from '../lib/progress'
import type { Replacement, TriggerTag } from '../lib/types'
import type { ScreenProps } from './props'
import { Page } from './ui'

export default function Triggers({ data, update, now, notify }: ScreenProps) {
  const s = data.settings
  const [logged, setLogged] = useState<TriggerTag | null>(null)
  const top = topTriggers(data.events)
  const before = now < s.quitAt
  const setRepl = (tag: TriggerTag, v: string) =>
    update((d) => {
      const replacements = { ...d.settings.replacements }
      if (v) replacements[tag] = v as Replacement
      else delete replacements[tag]
      return { ...d, settings: { ...d.settings, replacements } }
    })
  return (
    <Page title={t('nav.triggers')}>
      {before && (
        <section className="card">
          <h2>{t('home.log.title')}</h2>
          <p className="muted">{t('home.log.help')}</p>
          <div className="chips">
            {TRIGGER_TAGS.map((tag) => (
              <button key={tag} className="chip" onClick={() => {
                update((d) => ({ ...d, events: [...d.events, { type: 'smoke', at: Date.now(), trigger: tag }] }))
                setLogged(tag)
              }}>{t(`trigger.${tag}`)}</button>
            ))}
          </div>
          {logged && <p className="ok" role="status">{t('home.log.done', { trigger: t(`trigger.${logged}`) })}</p>}
        </section>
      )}
      <section className="card">
        <h2>{t('trg.top')}</h2>
        {top.length === 0 && <p className="muted">{t('trg.empty')}</p>}
        <ul className="log">
          {top.map((x) => (
            <li key={x.tag}>
              <span><strong>{t(`trigger.${x.tag}`)}</strong><br /><span className="muted">{t('trg.around', { time: `${String(x.hour).padStart(2, '0')}:00` })}</span></span>
              <span className="mid">{tn('trg.count', x.count)}</span>
            </li>
          ))}
        </ul>
        <p className="muted">{t('trg.nudge')}</p>
        {notify && notify !== 'ok' && <p className="note">{t(notify === 'denied' ? 'notif.off' : 'notif.unsupported')}</p>}
      </section>
      <section className="card">
        <h2>{t('trg.repl')}</h2>
        <p className="muted">{t('trg.repl.help')}</p>
        {TRIGGER_TAGS.map((tag) => (
          <div className="field" key={tag}>
            <label htmlFor={`r-${tag}`}>{t(`trigger.${tag}`)}</label>
            <select id={`r-${tag}`} value={s.replacements[tag] ?? ''} onChange={(e) => setRepl(tag, e.target.value)}>
              <option value="">{t('trg.repl.none')}</option>
              {REPLACEMENTS.map((r) => <option key={r} value={r}>{t(`repl.${r}`)}</option>)}
            </select>
          </div>
        ))}
      </section>
    </Page>
  )
}
