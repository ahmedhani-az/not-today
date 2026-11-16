import { fmtMoney, fmtNum } from '../lib/format'
import { t } from '../lib/i18n'
import { cigsAvoided, monthlySaving, moneySaved } from '../lib/progress'
import type { ScreenProps } from './props'
import { Bar, Page } from './ui'

export default function Money({ data, go, now }: ScreenProps) {
  const s = data.settings
  const saved = moneySaved(data, now)
  const cost = s.reward.cost
  const pct = cost > 0 ? (saved / cost) * 100 : 0
  return (
    <Page title={t('tile.money')} onBack={() => go('home')}>
      <section className="card center">
        <p className="eyebrow">{t('money.saved')}</p>
        <p className="big">{fmtMoney(saved, s.lang)}</p>
        <p className="muted">{t('money.avoided', { n: fmtNum(cigsAvoided(data, now), s.lang) })}</p>
      </section>
      <section className="card">
        <p className="eyebrow">{t('money.month')}</p>
        <p className="mid">{fmtMoney(monthlySaving(s), s.lang)}</p>
        {s.packPrice <= 0 && <p className="muted">{t('money.noprice')}</p>}
      </section>
      <section className="card">
        <h2>{t('money.reward')}</h2>
        {cost > 0 ? (
          <>
            <p>{s.reward.name || t('money.reward.unnamed')}</p>
            <Bar pct={pct} label={t('money.reward')} tick />
            <p className="muted">{t('money.reward.of', { a: fmtMoney(Math.min(saved, cost), s.lang), b: fmtMoney(cost, s.lang) })}</p>
          </>
        ) : (
          <>
            <p className="muted">{t('money.reward.none')}</p>
            <button className="btn ghost" onClick={() => go('settings')}>{t('money.reward.set')}</button>
          </>
        )}
      </section>
    </Page>
  )
}
