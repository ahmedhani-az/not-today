import { fmtDate, tn } from '../lib/format'
import { t } from '../lib/i18n'
import { cravingsBeaten } from '../lib/progress'
import type { ScreenProps } from './props'
import { Page, TextField } from './ui'

export default function Myself({ data, update, go }: ScreenProps) {
  const s = data.settings
  const log = data.events.filter((e) => e.type === 'win' || e.type === 'slip').slice().reverse().slice(0, 60)
  return (
    <Page title={t('tile.myself')} onBack={() => go('home')}>
      <section className="card center">
        <p className="big">{cravingsBeaten(data)}</p>
        <p className="muted">{t('myself.beaten')}</p>
      </section>
      <section className="card">
        <TextField label={t('set.line')} value={s.myLine} multiline
          onChange={(v) => update((d) => ({ ...d, settings: { ...d.settings, myLine: v } }))} />
      </section>
      <section className="card">
        <h2>{t('myself.log')}</h2>
        {log.length === 0 && <p className="muted">{t('myself.log.empty')}</p>}
        <ul className="log">
          {log.map((e, i) => (
            <li key={i} className={e.type}>
              <span>{e.type === 'win' ? t('myself.win') : tn('myself.slip', e.count ?? 1)}
                {e.trigger ? ` · ${t(`trigger.${e.trigger}`)}` : ''}</span>
              <span className="muted">{fmtDate(e.at, s.lang, true)}</span>
            </li>
          ))}
        </ul>
      </section>
    </Page>
  )
}
