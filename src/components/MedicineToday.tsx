import { fmtLeft, fmtTime } from '../lib/format'
import { nextDose, takeAsNeeded, takeDose, todaysDoses } from '../lib/game'
import { t } from '../lib/i18n'
import { haptic, sparkle } from '../lib/sound'
import type { AppData } from '../lib/types'
import { Icon } from '../screens/ui'

export default function MedicineToday({ data, now, update, bare }: { data: AppData; now: number; update: (fn: (d: AppData) => AppData) => void; bare?: boolean }) {
  const doses = todaysDoses(data, now)
  const m = data.settings.med
  const asNeeded = m.plan === 'none' ? [] : m.products.filter((p) => !(m.schedule[p]?.length)) // gums, spray: no fixed times
  if (!doses.length && !asNeeded.length) return null
  const next = nextDose(data, now)
  const lang = data.settings.lang
  const all = doses.length > 0 && doses.every((d) => d.taken)
  const take = (product: string, slot: string) => {
    update((d) => takeDose(d, Date.now(), product, slot))
    haptic(18); sparkle()
  }
  const used = (product: string) => {
    update((d) => takeAsNeeded(d, Date.now(), product))
    haptic(18); sparkle()
  }
  return (
    <section className={bare ? 'meds-today bare' : 'card meds-today'} aria-labelledby="medtoday-h">
      <h2 id="medtoday-h">{t('medtoday.title')}</h2>
      <ul className="dose-list">
        {doses.map((d) => {
          const isNext = !!next && next.product === d.product && next.slot === d.slot
          const name = t(`med.${d.product}.short`)
          const time = fmtTime(d.at, lang)
          const left = d.at - now
          return (
            <li key={d.product + d.slot} className={`dose${d.taken ? ' taken' : ''}${isNext ? ' next' : ''}`}>
              <span className="dose-ico"><Icon name="pill" size={22} /></span>
              <span className="dose-main">
                <span className="dose-name">{name}</span>
                <span className="dose-time">
                  {time}
                  {d.taken && d.onTime && <> · {t('medtoday.ontime')}</>}
                  {isNext && <> · <strong>{left < 60_000 ? t('medtoday.due') : t('medtoday.next', { left: fmtLeft(left) })}</strong></>}
                </span>
              </span>
              {d.taken
                ? <span className="dose-check" role="img" aria-label={t('medtoday.taken')}><Icon name="check" size={24} /></span>
                : !d.open ? null
                : <button className="dose-btn" onClick={() => take(d.product, d.slot)} aria-label={t('medtoday.take', { name, time })}><Icon name="check" size={24} /></button>}
            </li>
          )
        })}
        {asNeeded.map((id) => {
          const name = t(`med.${id}.short`)
          return (
            <li key={id} className="dose asneeded">
              <span className="dose-ico"><Icon name="pill" size={22} /></span>
              <span className="dose-main"><span className="dose-name">{t('medtoday.asneeded', { name })}</span></span>
              <button className="btn secondary" onClick={() => used(id)} aria-label={t('medtoday.used.aria', { name })}>{t('medtoday.used')}</button>
            </li>
          )
        })}
      </ul>
      {all && <p className="ok">{t('medtoday.alldone')}</p>}
    </section>
  )
}
