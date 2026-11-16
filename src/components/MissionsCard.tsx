import { useEffect, useRef, useState } from 'react'
import { chestReady, dailyMissions, missionDone, openChest, tickMission, todayKey } from '../lib/game'
import { MISSIONS } from '../lib/content'
import { t } from '../lib/i18n'
import { chime, haptic, reducedMotion, sparkle } from '../lib/sound'
import type { AppData } from '../lib/types'
import { Icon } from '../screens/ui'
import ChestArt from './ChestArt'
import Confetti from './Confetti'
import StickerArt from './StickerArt'

const ICON: Record<string, string> = { crave: 'target', meds: 'pill', break: 'leaf', water: 'water', walk: 'walk', check: 'lungs' }

export default function MissionsCard({ data, now, update }: { data: AppData; now: number; update: (fn: (d: AppData) => AppData) => void }) {
  const [last, setResult] = useState<{ day: string; sticker: string | null } | null>(null)
  const result = last && last.day === todayKey(now) ? last : null // yesterday's chest result does not carry over midnight
  const ids = dailyMissions(data, now)
  const ready = chestReady(data, now)
  const opened = data.game.missions.date === todayKey(now) && data.game.missions.chest
  const [shaking, setShaking] = useState(false)
  const [burst, setBurst] = useState(0)
  const [float, setFloat] = useState<string | null>(null)
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])

  const open = () => {
    if (shaking) return
    haptic([20, 40, 20])
    const go = () => {
      let sticker: string | null = null
      update((d) => { const r = openChest(d, Date.now(), Math.random); sticker = r.sticker; return r.data })
      setShaking(false); setResult({ day: todayKey(Date.now()), sticker }); setBurst((b) => b + 1)
      chime(); haptic([60, 40, 100])
    }
    if (reducedMotion()) return go()
    setShaking(true); sparkle()
    timer.current = window.setTimeout(go, 750)
  }
  const tick = (id: string) => {
    update((d) => tickMission(d, Date.now(), id))
    haptic(18); sparkle(); setFloat(id)
    window.setTimeout(() => setFloat(null), 1200)
  }

  if (!ids.length) return null
  const open_ = opened || !!result
  return (
    <section className="card missions" aria-labelledby="missions-h">
      <Confetti burst={burst} count={60} origin={0.55} />
      <h2 id="missions-h">{t('missions.title')}</h2>
      <p className="muted">{t('missions.sub')}</p>
      <ul className="mission-list">
        {ids.map((id) => {
          const done = missionDone(data, now, id)
          const self = MISSIONS.find((m) => m.id === id)?.self
          return (
            <li key={id} className={done ? 'mission done' : 'mission'}>
              <span className="mission-ico"><Icon name={ICON[id] ?? 'spark'} size={22} /></span>
              <span className="mission-name">{t(`mission.${id}`)}</span>
              {done ? (
                <span className="mission-done" role="img" aria-label={t('missions.done')}><Icon name="check" size={22} /></span>
              ) : self ? (
                <button className="btn tickbtn" onClick={() => tick(id)} aria-label={t('missions.tick', { mission: t(`mission.${id}`) })}>{t('missions.tickbtn')}</button>
              ) : <span className="mission-pts">+20</span>}
              {float === id && <span className="float-pts" aria-hidden="true">+20</span>}
            </li>
          )
        })}
      </ul>
      <div className={`chest-row${ready ? ' rdy' : ''}`}>
        <ChestArt open={open_} ready={ready && !shaking} shaking={shaking} />
        <div className="chest-text">
          <strong>{t('chest.title')}</strong>
          {result ? (
            <>
              <span className="ok">{t('chest.points')}</span>
              {result.sticker && (
                <span className="chest-sticker"><StickerArt id={result.sticker} size={44} /><span>{t('chest.sticker', { name: t(`sticker.${result.sticker}`) })}</span></span>
              )}
            </>
          ) : opened ? <span className="muted">{t('chest.opened')}</span>
            : ready ? <span className="ok">{t('chest.ready')}</span>
              : <span className="muted">{t('chest.locked')}</span>}
        </div>
        {ready && !result && <button className="btn primary" onClick={open} disabled={shaking}>{t('chest.open')}</button>}
      </div>
    </section>
  )
}
