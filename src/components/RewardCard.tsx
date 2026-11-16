import { useMemo, useState } from 'react'
import { faithRef, fmtLeft, fmtNum, kidsTitle } from '../lib/format'
import type { Reward } from '../lib/game'
import { t } from '../lib/i18n'
import { milestones, nextMilestone } from '../lib/progress'
import { haptic, sparkle } from '../lib/sound'
import type { AppData } from '../lib/types'
import { useCountUp } from '../lib/useCountUp'
import { Arabic } from '../screens/ui'
import StickerArt from './StickerArt'

const RING = 2 * Math.PI * 46

function Ring({ pct }: { pct: number }) {
  const shown = useCountUp(pct, 1400)
  return (
    <div className="ring" role="img" aria-label={t('reward.health.pct', { n: Math.round(pct) })}>
      <svg viewBox="0 0 110 110" aria-hidden="true">
        <circle cx="55" cy="55" r="46" className="ring-bg" />
        <circle cx="55" cy="55" r="46" className="ring-fg" strokeDasharray={RING} strokeDashoffset={RING * (1 - Math.max(0.02, shown / 100))} transform="rotate(-90 55 55)" />
      </svg>
      <span>{Math.round(shown)}%</span>
    </div>
  )
}

function Face({ reward, data, now }: { reward: Reward; data: AppData; now: number }) {
  const s = data.settings
  const lang = s.lang
  const kid = useMemo(() => {
    const list = s.kids.filter((k) => k.note.trim() || k.photo)
    return list.length ? list[Math.floor(Math.random() * list.length)] : null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const amount = reward.kind === 'points' ? reward.amount : 0
  const shownAmount = useCountUp(amount, 1100)
  switch (reward.kind) {
    case 'kids':
      return (
        <>
          <span className="avatar xl">{kid?.photo ? <img src={kid.photo} alt={kid.name} /> : <span>{(kid?.name ?? '').trim().charAt(0) || '♥'}</span>}</span>
          <h2>{t('reward.kids.title', { names: kid?.name.trim() || kidsTitle(s.kids, lang) })}</h2>
          {kid?.note.trim() && <p className="rc-note">“{kid.note}”</p>}
        </>
      )
    case 'faith': {
      const f = s.faithTexts.find((x) => x.id === reward.textId)
      if (!f) return null
      return (
        <>
          <p className="eyebrow">{t('reward.faith.title')}</p>
          <Arabic big>{f.ar}</Arabic>
          {lang === 'en' && <p className="rc-note">{f.en}</p>}
          {faithRef(f, lang) && <p className="muted">{faithRef(f, lang)}</p>}
        </>
      )
    }
    case 'points':
      return (
        <>
          <p className="eyebrow">{t('reward.points.title')}</p>
          <p className="rc-big">+{fmtNum(shownAmount, lang)}</p>
          <p className="rc-unit">{t('level.pts')}</p>
          <p className="muted">{t('reward.points.sub')}</p>
        </>
      )
    case 'health': {
      const nm = nextMilestone(data, now)
      if (!nm) return null
      const pct = milestones(data, now).find((m) => m.id === nm.id)?.pct ?? 0
      return (
        <>
          <p className="eyebrow">{t('reward.health.title')}</p>
          <Ring pct={pct} />
          <h2>{t(`ms.${nm.id}.title`)}</h2>
          <p className="muted">{t('reward.health.left', { left: fmtLeft(nm.msLeft) })}</p>
        </>
      )
    }
    default:
      return (
        <>
          <p className="eyebrow">{t('reward.sticker.title')}</p>
          <span className="sticker-hero"><StickerArt id={reward.id} size={132} /></span>
          <h2>{t(`sticker.${reward.id}`)}</h2>
          <p className="muted">{t('reward.sticker.sub')}</p>
        </>
      )
  }
}

/** A face-down card; one tap turns it over. */
export default function RewardCard({ reward, data, now, onFlip }: { reward: Reward; data: AppData; now: number; onFlip?: () => void }) {
  const [flipped, setFlipped] = useState(false)
  const flip = () => {
    if (flipped) return
    setFlipped(true); sparkle(); haptic([30, 30, 60]); onFlip?.()
  }
  return (
    <div className={`rcard${flipped ? ' flipped' : ''}`} onPointerDown={flip}
      role={flipped ? 'group' : 'button'} tabIndex={flipped ? -1 : 0} aria-label={flipped ? undefined : t('reward.back')}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip() } }}>
      <div className="rcard-inner">
        <div className="rcard-back" aria-hidden={flipped}>
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r="44" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="1.5" strokeDasharray="2 6" strokeLinecap="round" />
            <path d="M60 88V54" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M60 62Q36 62 34 40Q58 38 60 62Z" fill="#fff" fillOpacity=".95" />
            <path d="M60 52Q84 52 86 30Q62 28 60 52Z" fill="#fff" fillOpacity=".8" />
            <path className="rc-spark" d="M96 84l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#fff" />
            <path className="rc-spark s2" d="M22 30l1.5 3.5 3.5 1.5-3.5 1.5L22 40l-1.5-3.5L17 35l3.5-1.5Z" fill="#fff" />
          </svg>
        </div>
        <div className={`rcard-front kind-${reward.kind}`}><Face reward={reward} data={data} now={now} /></div>
      </div>
    </div>
  )
}
