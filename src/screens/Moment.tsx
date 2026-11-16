import { useEffect, useRef, useState } from 'react'
import Confetti from '../components/Confetti'
import GardenScene from '../components/GardenScene'
import { flowerCount, shownFruit, shownTreeStage, skyPhase } from '../lib/game'
import { t } from '../lib/i18n'
import { chime, haptic } from '../lib/sound'
import type { AppData } from '../lib/types'
import { dailyFaith } from './Home'
import { Arabic, Icon } from './ui'

/** Full-screen moment for a new badge (`id`) or a new level (`level:N`). */
export default function Moment({ id, data, now, onDone }: { id: string; data: AppData; now: number; onDone: () => void }) {
  const s = data.settings
  const btn = useRef<HTMLButtonElement>(null)
  const [burst, setBurst] = useState(0)
  const level = id.startsWith('level:') ? Number(id.slice(6)) : 0
  useEffect(() => {
    btn.current?.focus()
    setBurst((b) => b + 1)
    chime(level > 0)
    haptic(level > 0 ? [80, 60, 80, 60, 160] : [60, 40, 100])
  }, [id, level])
  const faith = s.faithOn ? dailyFaith(data, now + id.length * 86_400_000) : null
  const title = level ? t('moment.level') : t(`badge.${id}.name`)
  return (
    <div className="overlay moment" role="dialog" aria-modal="true" aria-label={title}>
      <Confetti burst={burst} count={level ? 90 : 70} />
      {level ? (
        <>
          <div className="moment-scene">
            <GardenScene stage={shownTreeStage(data, now)} flowers={flowerCount(data)} fruit={shownFruit(data, now)} level={level} sky={skyPhase(now)} />
          </div>
          <div className="level-medal" aria-hidden="true"><span>{level}</span></div>
          <p className="eyebrow">{t('moment.level')}</p>
          <h1>{t(`level.${Math.min(10, level)}`)}</h1>
          <p className="muted">{t('level.up.body', { name: t(`level.${Math.min(10, level)}`) })}</p>
        </>
      ) : (
        <>
          {s.kids.length > 0 && (
            <div className="avatars big">
              {s.kids.slice(0, 4).map((k, i) => (
                <span className="avatar big" key={i}>{k.photo ? <img src={k.photo} alt="" /> : <span>{k.name.trim().charAt(0) || '?'}</span>}</span>
              ))}
            </div>
          )}
          <span className="trophy-glow"><Icon name="trophy" size={48} /></span>
          <p className="eyebrow">{t('moment.new')}</p>
          <h1>{t(`badge.${id}.name`)}</h1>
          <p className="muted">{t(`badge.${id}.how`)}</p>
          {faith && <><Arabic big>{faith.ar}</Arabic>{s.lang === 'en' && <p>{faith.en}</p>}</>}
        </>
      )}
      <button ref={btn} className="btn primary wide" onClick={onDone}>{t('ui.continue')}</button>
    </div>
  )
}
