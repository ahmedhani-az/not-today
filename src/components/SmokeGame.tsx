import { useEffect, useRef, useState, type ReactNode } from 'react'
import { t } from '../lib/i18n'
import { haptic, popSound, reducedMotion } from '../lib/sound'

type Cloud = { id: number; y: number; w: number; dur: number; delay: number; x: number; shape: number; popped: boolean }

const MAX = 8
const FIRST_GAP = 700, LAST_GAP = 3600

const SHAPES = [
  'M6 52Q-4 36 14 30Q10 10 34 12Q44 -4 66 8Q86 0 96 20Q122 18 120 40Q130 56 106 58Q60 64 6 52Z',
  'M4 50Q-6 32 16 28Q18 8 42 14Q58 -2 78 14Q104 8 110 30Q128 38 112 54Q60 62 4 50Z',
  'M8 54Q-6 40 12 32Q8 14 30 14Q40 0 62 10Q80 -2 98 14Q122 16 118 38Q128 54 104 58Q56 66 8 54Z',
]

/** "Clear the smoke": grey clouds drift over a picture; a tap pops one. They thin out as the timer runs down. */
export default function SmokeGame({ left, total, clock, photo, scene, onPop, pops }: {
  left: number; total: number; clock: string; photo?: string; scene: ReactNode; onPop: () => void; pops: number
}) {
  const [clouds, setClouds] = useState<Cloud[]>([])
  const leftRef = useRef(left)
  leftRef.current = left
  const seq = useRef(0)
  const timers = useRef<number[]>([])
  const calm = reducedMotion()

  const remove = (id: number, after: number) => timers.current.push(window.setTimeout(() => setClouds((c) => c.filter((x) => x.id !== id)), after))

  useEffect(() => {
    const make = (early: boolean): Cloud => {
      const dur = 12 + Math.random() * 5
      return {
        id: ++seq.current, y: Math.random() * 70, w: 110 + Math.random() * 64, dur,
        delay: early ? -Math.random() * dur * 0.75 : 0, x: Math.random() * 60, shape: seq.current % 3, popped: false,
      }
    }
    const add = (early: boolean) => {
      const c = make(early)
      setClouds((cs) => (cs.length >= MAX ? cs : [...cs, c]))
      remove(c.id, (c.dur + c.delay) * 1000 + 100)
    }
    for (let i = 0; i < 5; i++) add(true)
    let id = 0
    const loop = () => {
      const l = leftRef.current
      const p = 1 - l / total
      if (l > 14_000 && !document.hidden) add(false)
      id = window.setTimeout(loop, FIRST_GAP + p * (LAST_GAP - FIRST_GAP))
    }
    id = window.setTimeout(loop, FIRST_GAP)
    return () => { clearTimeout(id); timers.current.forEach(clearTimeout); timers.current = [] }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total])

  const pop = (id: number) => {
    setClouds((cs) => cs.map((c) => (c.id === id && !c.popped ? { ...c, popped: true } : c)))
    remove(id, calm ? 0 : 420)
    popSound(); haptic(10); onPop()
  }

  return (
    <div className="game">
      <div className="game-box" role="group" aria-label={t('game.area')}>
        <div className="game-pic">{photo ? <img src={photo} alt="" draggable={false} /> : scene}</div>
        <svg width="0" height="0" className="game-defs" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="smk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d3d9db" /><stop offset="1" stopColor="#97a2a7" /></linearGradient>
            {SHAPES.map((d, i) => <path key={i} id={`smk-s${i}`} d={d} />)}
          </defs>
        </svg>
        {clouds.map((c) => (
          <div key={c.id} className={c.popped ? 'smoke popped' : 'smoke'} onPointerDown={() => pop(c.id)}
            style={{ top: `${c.y}%`, inlineSize: c.w, animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s`, '--x': `${c.x}%` } as React.CSSProperties}>
            <svg viewBox="-6 -6 138 76" className="smoke-body" aria-hidden="true" focusable="false">
              <use href={`#smk-s${c.shape}`} fill="url(#smk)" stroke="#aab4b8" strokeWidth="2" opacity=".93" />
              <use href={`#smk-s${c.shape}`} transform="translate(8 6) scale(.82)" fill="#fff" opacity=".28" />
            </svg>
            {c.popped && !calm && [0, 1, 2, 3, 4, 5].map((i) => <span key={i} className="puff" style={{ '--a': `${i * 60 + 20}deg` } as React.CSSProperties} />)}
          </div>
        ))}
        <div className="game-clock" role="timer" aria-label={t('craving.left', { time: clock })}>{clock}</div>
        <div className="game-bar" aria-hidden="true"><span style={{ transform: `scaleX(${Math.max(0, left / total)})` }} /></div>
      </div>
      <p className="game-caption"><span>{t('game.hint')}</span><strong aria-live="off">{t('game.pops', { n: pops })}</strong></p>
    </div>
  )
}
