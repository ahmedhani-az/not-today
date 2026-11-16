import GardenScene from '../components/GardenScene'
import StickerBook from '../components/StickerBook'
import { TREE_STAGES } from '../lib/content'
import { fmtLeft } from '../lib/format'
import { flowerCount, levelProgress, nextTreeStage, shownFruit as bestFruit, shownPoints, shownTreeStage, skyPhase, visitors } from '../lib/game'
import { t } from '../lib/i18n'
import { DAY } from '../lib/progress'
import { useCountUp } from '../lib/useCountUp'
import type { ScreenProps } from './props'
import { Page } from './ui'

export default function Garden({ data, now, go }: ScreenProps) {
  const stage = shownTreeStage(data, now)
  const next = nextTreeStage(data, now)
  const flowers = flowerCount(data)
  const fruit = bestFruit(data, now)
  const level = levelProgress(shownPoints(data, now)).level
  const v = visitors(level)
  const shownFlowers = Math.round(useCountUp(flowers))
  const shownFruit = Math.round(useCountUp(fruit))
  return (
    <Page title={t('garden.title')} onBack={() => go('home')}>
      <GardenScene className="big" stage={stage} flowers={flowers} fruit={fruit} level={level} sky={skyPhase(now)} />
      <p className="lead garden-stage">{t(`tree.${stage}`)}</p>

      <section className="card next-grow">
        <p className="eyebrow">{t('garden.next')}</p>
        <div className="stage-dots" aria-hidden="true">
          {TREE_STAGES.map((_, i) => <span key={i} className={i <= stage ? 'sd on' : i === stage + 1 ? 'sd soon' : 'sd'} />)}
        </div>
        {next
          ? <h2>{t('garden.next.body', { stage: t(`tree.${next.stage}`), left: fmtLeft(Math.max(1, next.daysLeft) * DAY) })}</h2>
          : <h2>{t('garden.next.done')}</h2>}
      </section>

      <section className="card">
        <h2>{t('garden.totals')}</h2>
        <div className="stat-row">
          <div className="stat"><span className="stat-n">{shownFlowers}</span><span className="muted">{t('stat.flowers')}</span></div>
          <div className="stat"><span className="stat-n">{shownFruit}</span><span className="muted">{t('stat.fruit')}</span></div>
          <div className="stat"><span className="stat-n">{level}</span><span className="muted">{t('stat.level')}</span></div>
        </div>
        {flowers > 40 && <p className="muted">{t('garden.flowers.more', { n: flowers - 40 })}</p>}
        <p className="muted">{t('garden.fruit.help')}</p>
        <h3>{t('garden.visitors')}</h3>
        <p>{[v.butterfly && t('visitor.butterfly'), v.bird && t('visitor.bird'), v.bees && t('visitor.bees')].filter(Boolean).join(' · ') || '—'}</p>
        <p className="muted">{t('garden.visitors.hint')}</p>
      </section>

      <StickerBook owned={data.game.stickers} />
    </Page>
  )
}
