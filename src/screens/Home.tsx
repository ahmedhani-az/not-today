import { nextBadge } from '../lib/achievements'
import { TRIGGER_TAGS } from '../lib/content'
import { fmtLeft, fmtMoney, kidsTitle, tn } from '../lib/format'
import { t } from '../lib/i18n'
import { cravingsBeaten, DAY, elapsed, moneySaved, nextMilestone, overallRecovery, smokeFreeDays } from '../lib/progress'
import { flowerCount, levelProgress, shownFruit, shownPoints, shownTreeStage, skyPhase } from '../lib/game'
import { fmtNum } from '../lib/format'
import { useCountUp } from '../lib/useCountUp'
import GardenScene from '../components/GardenScene'
import MedicineToday from '../components/MedicineToday'
import MissionsCard from '../components/MissionsCard'
import type { ScreenProps } from './props'
import { Arabic, Icon } from './ui'
import { useState } from 'react'

export function dailyFaith(d: ScreenProps['data'], now: number) {
  const list = d.settings.faithTexts.filter((f) => !f.onSlip)
  return list.length ? list[Math.floor(now / DAY) % list.length] : null
}

export default function Home({ data, update, go, now }: ScreenProps) {
  const s = data.settings
  const before = now < s.quitAt
  const [logged, setLogged] = useState<string | null>(null)
  const days = smokeFreeDays(data, now)
  const dayNo = before ? 0 : Math.floor(elapsed(data, now) / DAY) + 1
  const faith = s.faithOn ? dailyFaith(data, now) : null
  const next = nextMilestone(data, now)
  const latest = data.badges[data.badges.length - 1]
  const upcoming = nextBadge(data, now)
  const pts = shownPoints(data, now)
  const lv = levelProgress(pts)
  const shownPts = useCountUp(pts)
  const shownPct = useCountUp(lv.pct, 1100)
  const shownDays = useCountUp(days)
  const shownMoney = useCountUp(moneySaved(data, now))

  const logSmoke = (tag: (typeof TRIGGER_TAGS)[number]) => {
    update((d) => ({ ...d, events: [...d.events, { type: 'smoke', at: Date.now(), trigger: tag }] }))
    setLogged(tag)
  }

  return (
    <main className="page home">
      <section className="home-hero">
        <button className="hero-scene" onClick={() => go('garden')} aria-label={t('home.garden.open')}>
          <GardenScene stage={shownTreeStage(data, now)} flowers={flowerCount(data)} fruit={shownFruit(data, now)} level={lv.level} sky={skyPhase(now)} />
          <span className="hero-open" aria-hidden="true"><Icon name="back" size={18} /></span>
        </button>
        <div className="hero-body">
          {before ? (
            <>
              <p className="eyebrow">{t('home.before')}</p>
              <p className="big">{fmtLeft(s.quitAt - now)}</p>
              <p className="muted">{t('home.before.help')}</p>
            </>
          ) : (
            <>
              <p className="eyebrow">{t('home.day', { n: dayNo })}</p>
              <p className="big">{t('home.nottoday')}</p>
              <p className="muted">{tn('home.total', Math.round(shownDays))}</p>
            </>
          )}
          <div className="level-row">
            <span className="level-badge" aria-hidden="true">{lv.level}</span>
            <div className="level-main">
              <div className="level-head">
                <strong>{t(`level.${Math.min(10, lv.level)}`)}</strong>
                <span className="muted">{t('level.label', { n: lv.level })}</span>
              </div>
              <div className="xp" role="progressbar" aria-label={t('level.togo', { n: fmtNum(lv.span - lv.into, s.lang), level: lv.level + 1 })} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(lv.pct)}>
                <div className="xp-fill" style={{ transform: `scaleX(${Math.max(0.03, Math.min(1, shownPct / 100))})` }} />
              </div>
              <div className="level-foot">
                <span className="muted">{t('level.togo', { n: fmtNum(lv.span - lv.into, s.lang), level: lv.level + 1 })}</span>
                <span className="pts" aria-label={tn('unit.points', pts)}>{fmtNum(shownPts, s.lang)} <small>{t('level.pts')}</small></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <button className="craving-btn" onClick={() => go('craving')}>
        <span className="craving-main">{t('home.craving')}</span>
        <span className="craving-sub">{t('home.craving.sub')}</span>
      </button>
      <button className="btn secondary wide" onClick={() => go('break')}>{t('home.break')}</button>
      {!before && <button className="btn ghost quiet" onClick={() => go('slip')}>{t('craving.smoked')}</button>}

      <MedicineToday data={data} now={now} update={update} />
      <MissionsCard data={data} now={now} update={update} />

      {before && (
        <section className="card">
          <h2>{t('home.log.title')}</h2>
          <p className="muted">{t('home.log.help')}</p>
          <div className="chips">
            {TRIGGER_TAGS.map((tag) => (
              <button key={tag} className="chip" onClick={() => logSmoke(tag)}>{t(`trigger.${tag}`)}</button>
            ))}
          </div>
          {logged && <p className="ok" role="status">{t('home.log.done', { trigger: t(`trigger.${logged}`) })}</p>}
        </section>
      )}

      <div className="tiles">
        <button className="tile" onClick={() => go('money')}>
          <Icon name="coin" /><span className="tile-name">{t('tile.money')}</span>
          <span className="tile-val">{fmtMoney(shownMoney, s.lang)}</span>
        </button>
        <button className="tile" onClick={() => go('health')}>
          <Icon name="lungs" /><span className="tile-name">{t('tile.health')}</span>
          <span className="tile-val">{overallRecovery(data, now)}%</span>
          {next && <span className="tile-sub">{t(`ms.${next.id}.title`)}</span>}
        </button>
        <button className="tile" onClick={() => go('kids')}>
          <Icon name="heart" /><span className="tile-name">{kidsTitle(s.kids, s.lang)}</span>
          {s.kids.length ? (
            <span className="avatars">
              {s.kids.slice(0, 4).map((k, i) => (
                <span className="avatar" key={i}>{k.photo ? <img src={k.photo} alt="" /> : <span>{k.name.trim().charAt(0) || '?'}</span>}</span>
              ))}
            </span>
          ) : <span className="tile-sub">{t('tile.kids.add')}</span>}
        </button>
        <button className="tile" onClick={() => go('myself')}>
          <Icon name="user" /><span className="tile-name">{t('tile.myself')}</span>
          <span className="tile-val">{cravingsBeaten(data)}</span>
          <span className="tile-sub">{t('tile.myself.sub')}</span>
        </button>
        {faith && (
          <button className="tile wide" onClick={() => go('faith')}>
            <Icon name="moon" /><span className="tile-name">{t('tile.faith')}</span>
            <Arabic>{faith.ar}</Arabic>
            {s.lang === 'en' && <span className="tile-sub">{faith.en}</span>}
          </button>
        )}
      </div>

      <section className="card" onClick={() => go('achievements')} role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') go('achievements') }}>
        <h2>{t('home.badges')}</h2>
        <div className="badge-row">
          <Icon name="trophy" />
          <div>
            <p className="eyebrow">{t('home.badge.latest')}</p>
            <p>{latest ? t(`badge.${latest}.name`) : t('home.badge.none')}</p>
          </div>
        </div>
        {upcoming && (
          <div className="badge-row dim">
            <Icon name="target" />
            <div>
              <p className="eyebrow">{t('home.badge.next')}</p>
              <p>{t(`badge.${upcoming}.name`)}</p>
              <p className="muted">{t(`badge.${upcoming}.how`)}</p>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
