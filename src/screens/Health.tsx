import { useState } from 'react'
import { fmtDate, fmtLeft, tn } from '../lib/format'
import { t } from '../lib/i18n'
import { DAY, milestones, nextMilestone, overallRecovery } from '../lib/progress'
import type { Check } from '../lib/types'
import type { ScreenProps } from './props'
import { Bar, Icon, Page } from './ui'

const METRICS = ['breathing', 'cough', 'sleep', 'energy', 'focus'] as const

function Chart({ checks }: { checks: Check[] }) {
  const W = 320, H = 150, P = 18
  const x = (i: number) => P + (checks.length < 2 ? 0 : (i * (W - 2 * P)) / (checks.length - 1))
  const y = (v: number) => H - P - ((v - 1) / 4) * (H - 2 * P)
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={t('health.chart')}>
        {[1, 3, 5].map((v) => <line key={v} x1={P} x2={W - P} y1={y(v)} y2={y(v)} className="grid" />)}
        {METRICS.map((m, k) => (
          <polyline key={m} className={`line l${k}`} fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            points={checks.map((c, i) => `${x(i)},${y(c[m])}`).join(' ')} />
        ))}
        {METRICS.map((m, k) => checks.map((c, i) => <circle key={m + i} className={`dotc l${k}`} cx={x(i)} cy={y(c[m])} r="3" />))}
      </svg>
      <figcaption className="legend">
        {METRICS.map((m, k) => <span key={m}><i className={`sw l${k}`} />{t(`health.${m}.short`)}</span>)}
      </figcaption>
    </figure>
  )
}

export default function Health({ data, update, go, now }: ScreenProps) {
  const s = data.settings
  const ms = milestones(data, now)
  const next = nextMilestone(data, now)
  const last = data.checks[data.checks.length - 1]
  const wait = last ? Math.ceil((last.at + 7 * DAY - now) / DAY) : 0
  const [vals, setVals] = useState<Record<string, number>>({})
  const ready = METRICS.every((m) => vals[m])
  const submit = () => {
    if (!ready || wait > 0) return
    update((d) => ({ ...d, checks: [...d.checks, { at: Date.now(), ...(vals as Omit<Check, 'at'>) }] }))
    setVals({})
  }
  return (
    <Page title={t('tile.health')} onBack={() => go('home')}>
      <section className="card center">
        <p className="big">{overallRecovery(data, now)}%</p>
        <p className="muted">{t('health.overall')}</p>
        {next && <p>{t('health.next', { title: t(`ms.${next.id}.title`), left: fmtLeft(next.msLeft) })}</p>}
      </section>
      <section className="card">
        {ms.map((m) => (
          <div className="milestone" key={m.id}>
            <div className="milestone-head">
              <strong>{t(`ms.${m.id}.title`)}</strong>
              {m.reached && <span className="tick"><Icon name="check" size={18} /> {t('health.reached')}</span>}
            </div>
            <p>{t(`ms.${m.id}.body`)}</p>
            <Bar pct={m.pct} label={t(`ms.${m.id}.title`)} tick />
          </div>
        ))}
        <p className="muted">{t('health.slips')}</p>
      </section>

      <section className="card">
        <h2>{t('health.check')}</h2>
        <p className="note">{t('health.withdrawal')}</p>
        {data.checks.length >= 2 ? <Chart checks={data.checks} /> : <p className="muted">{t('health.chart.need')}</p>}
        {last && <p className="muted">{t('health.last', { date: fmtDate(last.at, s.lang) })}</p>}
        {wait > 0 ? (
          <p>{t('health.wait', { left: tn('unit.days', wait) })}</p>
        ) : (
          <>
            <p className="muted">{t('health.check.help')}</p>
            {METRICS.map((m) => (
              <fieldset key={m} className="rate">
                <legend>{t(`health.${m}`)}</legend>
                <div className="rate-row">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <label key={v} className={vals[m] === v ? 'rate-opt on' : 'rate-opt'}>
                      <input type="radio" name={m} value={v} checked={vals[m] === v} onChange={() => setVals({ ...vals, [m]: v })} />
                      <span>{v}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            <button className="btn primary wide" disabled={!ready} onClick={submit}>{t('health.save')}</button>
          </>
        )}
      </section>
    </Page>
  )
}
