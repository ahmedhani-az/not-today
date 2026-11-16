import { BADGES, earnedBadges, nextBadge } from '../lib/achievements'
import { t } from '../lib/i18n'
import type { ScreenProps } from './props'
import { Icon, Page } from './ui'

export default function Achievements({ data, now }: ScreenProps) {
  const have = new Set([...data.badges, ...earnedBadges(data, now)])
  const next = nextBadge(data, now)
  const earned = BADGES.filter((b) => have.has(b.id))
  const rest = BADGES.filter((b) => !have.has(b.id) && b.id !== next)
  return (
    <Page title={t('nav.achievements')}>
      {next && (
        <section className="card next">
          <p className="eyebrow">{t('ach.next')}</p>
          <div className="badge-row"><Icon name="target" /><div><h2>{t(`badge.${next}.name`)}</h2><p className="muted">{t(`badge.${next}.how`)}</p></div></div>
        </section>
      )}
      <section className="card">
        <h2>{t('ach.earned', { n: earned.length })}</h2>
        {earned.length === 0 && <p className="muted">{t('ach.none')}</p>}
        <ul className="badges">
          {earned.map((b) => (
            <li key={b.id} className="badge on"><Icon name="trophy" /><div><strong>{t(`badge.${b.id}.name`)}</strong><p className="muted">{t(`badge.${b.id}.how`)}</p></div></li>
          ))}
        </ul>
      </section>
      <section className="card">
        <h2>{t('ach.locked')}</h2>
        <ul className="badges">
          {rest.map((b) => (
            <li key={b.id} className="badge"><Icon name="trophy" /><div><strong>{t(`badge.${b.id}.name`)}</strong><p className="muted">{t(`badge.${b.id}.how`)}</p></div></li>
          ))}
        </ul>
      </section>
    </Page>
  )
}
