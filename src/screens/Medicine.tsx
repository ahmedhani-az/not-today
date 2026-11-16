import MedicineToday from '../components/MedicineToday'
import { defaultTimes, MEDICINES } from '../lib/content'
import { fmtLeft, fromDateInput, sameDay, toDateInput } from '../lib/format'
import { t } from '../lib/i18n'
import { retimeDose } from '../lib/game'
import { courseDay } from '../lib/progress'
import type { MedPlan, Settings } from '../lib/types'
import type { ScreenProps } from './props'
import { Check, NumField, Page } from './ui'
import { useState } from 'react'

const PLANS: MedPlan[] = ['none', 'champix', 'nrt']

export default function Medicine({ data, update, award, now, notify }: ScreenProps) {
  const [asking, setAsking] = useState(false)
  const s = data.settings
  const m = s.med
  const patch = (p: Partial<Settings['med']>) => update((d) => ({ ...d, settings: { ...d.settings, med: { ...d.settings.med, ...p } } }))
  const day = courseDay(s, now)
  const takenToday = data.events.filter((e) => e.type === 'dose' && sameDay(e.at, now)).length
  const setPlan = (plan: MedPlan) =>
    plan !== m.plan && patch({ plan, products: [], schedule: {}, startAt: plan === 'champix' ? s.quitAt - 7 * 86_400_000 : plan === 'nrt' ? s.quitAt : m.startAt })
  const toggle = (id: string, on: boolean) => {
    const { [id]: _gone, ...rest } = m.schedule
    patch({ products: on ? [...m.products, id] : m.products.filter((x) => x !== id), schedule: on ? { ...m.schedule, [id]: defaultTimes(id) } : rest })
  }
  const setTimes = (id: string, next: string[]) => patch({ schedule: { ...m.schedule, [id]: next } })
  // Changing a slot's time carries today's tick over to the new time, so it is not ticked twice.
  const editTime = (id: string, i: number, v: string) => update((d) => {
    const old = d.settings.med.schedule[id]?.[i]
    const next = (d.settings.med.schedule[id] ?? []).map((y, j) => (j === i ? v : y))
    const moved = old === undefined ? d : retimeDose(d, Date.now(), id, old, v)
    return { ...moved, settings: { ...moved.settings, med: { ...moved.settings.med, schedule: { ...moved.settings.med.schedule, [id]: next } } } }
  })

  return (
    <Page title={t('nav.medicine')}>
      <section className="card">
        <h2>{t('med.plan')}</h2>
        <p className="muted">{t('med.plan.help')}</p>
        <div className="chips">
          {PLANS.map((p) => (
            <button key={p} className={m.plan === p ? 'chip on' : 'chip'} aria-pressed={m.plan === p} onClick={() => setPlan(p)}>{t(`med.plan.${p}`)}</button>
          ))}
        </div>
      </section>

      {m.plan !== 'none' && (
        <>
          <section className="card center">
            <p className="mid">{day > 0 ? t('med.course', { n: day }) : t('med.course.before', { left: fmtLeft(m.startAt - now) })}</p>
            {takenToday > 0 && <p className="ok">{t('med.taken.today', { n: takenToday })}</p>}
            {!data.badges.includes('med-course') && (asking ? (
              <div className="note" role="alertdialog" aria-label={t('med.finish.confirm')}>
                <p>{t('med.finish.confirm')}</p>
                <div className="row">
                  <button className="btn primary" onClick={() => { award('med-course'); setAsking(false) }}>{t('med.finish.yes')}</button>
                  <button className="btn ghost" onClick={() => setAsking(false)}>{t('ui.cancel')}</button>
                </div>
              </div>
            ) : <button className="btn ghost wide" onClick={() => setAsking(true)}>{t('med.finish')}</button>)}
          </section>

          <MedicineToday data={data} now={now} update={update} />

          <section className="card">
            <div className="field">
              <label htmlFor="med-start">{t('med.start')}</label>
              <input id="med-start" type="date" value={toDateInput(m.startAt)}
                onChange={(e) => { const at = fromDateInput(e.target.value); if (at !== null) patch({ startAt: at }) }} />
            </div>
            {notify && notify !== 'ok' && <p className="note">{t(notify === 'denied' ? 'notif.off' : 'notif.unsupported')}</p>}
          </section>
        </>
      )}

      <section className="card">
        <h2>{t('med.products')}</h2>
        <p className="muted">{t('med.products.note')}</p>
        {MEDICINES.map((x) => {
          const mine = x.plan === m.plan // only the helpers of the plan can be ticked; the rest are there to read
          const on = m.products.includes(x.id)
          const times = m.schedule[x.id] ?? []
          return (
            <div className="product" key={x.id}>
              {mine ? <Check label={t(`med.${x.id}.name`)} checked={on} onChange={(v) => toggle(x.id, v)} /> : <h3>{t(`med.${x.id}.name`)}</h3>}
              <p className="muted">{t(`med.${x.id}.type`)} · {x.rx ? t('med.rx') : t('med.norx')}</p>
              <p>{t(`med.${x.id}.note`)}</p>
              <p className="note when">{t(`med.${x.id}.when`)}</p>
              {mine && on && (
                <div className="times">
                  <h3>{t('med.times.for')}</h3>
                  {times.map((v, i) => (
                    <div className="row" key={i}>
                      <input type="time" aria-label={t('med.time.of', { name: t(`med.${x.id}.short`), n: i + 1 })} value={v}
                        onChange={(e) => editTime(x.id, i, e.target.value)} />
                      <button className="btn ghost" onClick={() => setTimes(x.id, times.filter((_, j) => j !== i))}>{t('ui.remove')}</button>
                    </div>
                  ))}
                  {!times.length && <p className="muted">{t('med.nofixed')}</p>}
                  <button className="btn ghost" onClick={() => setTimes(x.id, [...times, '09:00'])}>{t('med.times.add')}</button>
                </div>
              )}
              {mine && <NumField label={t('med.price')} value={m.prices[x.id] ?? x.priceEgp ?? 0}
                onChange={(n) => patch({ prices: { ...m.prices, [x.id]: n } })} />}
            </div>
          )
        })}
        {m.plan !== 'none' && !m.products.length && <p className="muted">{t('med.tickfirst')}</p>}
      </section>

      {now >= s.quitAt - 86_400_000 && now < s.quitAt + 28 * 86_400_000 && <p className="note">{t('med.coffee')}</p>}

      <section className="card">
        <p className="note">{t('med.follow')}</p>
        <p className="note">{t('med.line.dose')}</p>
        <p className="muted">{t('med.line.prices')}</p>
        <p className="muted">{t('med.line.champix')}</p>
      </section>

      <section className="card">
        <h2>{t('med.hotlines')}</h2>
        <div className="row">
          <a className="btn secondary grow" href="tel:105">{t('med.call', { n: 105 })}</a>
          <a className="btn secondary grow" href="tel:15335">{t('med.call', { n: 15335 })}</a>
        </div>
      </section>
    </Page>
  )
}
