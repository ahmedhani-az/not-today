import { fmtMoney, kidsTitle, tn } from '../lib/format'
import { t } from '../lib/i18n'
import { moneySaved, smokeFreeDays } from '../lib/progress'
import type { ScreenProps } from './props'
import { Bar, NumField, Page, TextField } from './ui'

export default function Kids({ data, update, go, now }: ScreenProps) {
  const s = data.settings
  const saved = moneySaved(data, now)
  const kr = s.kidsReward
  const setKid = (i: number, note: string) =>
    update((d) => ({ ...d, settings: { ...d.settings, kids: d.settings.kids.map((k, j) => (j === i ? { ...k, note } : k)) } }))
  const setReward = (r: Partial<typeof kr>) =>
    update((d) => ({ ...d, settings: { ...d.settings, kidsReward: { ...d.settings.kidsReward, ...r } } }))
  return (
    <Page title={kidsTitle(s.kids, s.lang)} onBack={() => go('home')}>
      {s.kids.length === 0 ? (
        <section className="card center">
          <p className="muted">{t('kids.none')}</p>
          <button className="btn primary" onClick={() => go('settings')}>{t('kids.none.go')}</button>
        </section>
      ) : (
        <section className="card center">
          <div className="avatars big">
            {s.kids.map((k, i) => (
              <span className="avatar big" key={i}>{k.photo ? <img src={k.photo} alt={k.name} /> : <span>{k.name.trim().charAt(0) || '?'}</span>}</span>
            ))}
          </div>
          <p className="mid">{tn('kids.days', smokeFreeDays(data, now))}</p>
        </section>
      )}
      {s.kids.map((k, i) => (
        <section className="card" key={i}>
          <TextField label={t('kids.note', { name: k.name || '…' })} value={k.note} multiline
            placeholder={t('kids.note.ph')} onChange={(v) => setKid(i, v)} />
        </section>
      ))}
      <section className="card">
        <h2>{t('kids.reward')}</h2>
        <p className="muted">{t('kids.reward.help')}</p>
        <TextField label={t('kids.reward.name')} value={kr.name} onChange={(v) => setReward({ name: v })} />
        <NumField label={t('kids.reward.cost')} value={kr.cost} onChange={(n) => setReward({ cost: n })} />
        {kr.cost > 0 && (
          <>
            <Bar pct={(saved / kr.cost) * 100} label={t('kids.reward')} tick />
            <p className="muted">{t('money.reward.of', { a: fmtMoney(Math.min(saved, kr.cost), s.lang), b: fmtMoney(kr.cost, s.lang) })}</p>
          </>
        )}
      </section>
    </Page>
  )
}
