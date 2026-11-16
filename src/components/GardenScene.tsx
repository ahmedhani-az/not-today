import { useEffect, useId, useRef, useState } from 'react'
import { flowerLayout, visitors } from '../lib/game'
import { t } from '../lib/i18n'
import { blob, rng } from './garden/art'
import FlowerArt from './garden/FlowerArt'
import TreeArt, { FruitArt } from './garden/TreeArt'

export type Sky = 'dawn' | 'day' | 'dusk' | 'night'
type Props = { stage: number; flowers: number; fruit: number; level: number; sky: Sky; className?: string }

// Flowers already seen bloom: when Home is shown again, only the new ones pop.
let seenFlowers = -1

// Early stages are drawn small; scaling them up keeps the scene from looking empty.
const GROW = [1.9, 1.9, 1.6, 1.3, 1.18, 1.08, 1, 1, 1]
const STARS = (() => { const r = rng(5); return Array.from({ length: 26 }, () => ({ x: r() * 400, y: 6 + r() * 120, s: 0.6 + r() * 1.1 })) })()
const FIREFLIES = [[70, 232, 0], [130, 262, 1.3], [250, 245, 0.6], [330, 228, 2.1], [300, 268, 1.7], [190, 270, 0.9]]
const SUN: Record<Sky, [number, number, string, string]> = {
  day: [88, 78, '#fff3b0', '#ffd24a'], dawn: [96, 170, '#ffe2bd', '#ff9d6b'], dusk: [318, 168, '#ffd29a', '#ff7a45'], night: [288, 68, '#dfe9ff', '#9db8ff'],
}

function Cloud({ x, y, s, dur, delay }: { x: number; y: number; s: number; dur: number; delay: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className="cloud-drift" style={{ animationDuration: `${dur}s`, animationDelay: `${delay}s` }}>
        <path d="M0 14Q-2 4 9 4Q12 -6 24 -2Q30 -10 40 -2Q54 -4 52 8Q60 12 52 16Q40 18 0 14Z" className="cloud" />
      </g>
    </g>
  )
}

export default function GardenScene({ stage, flowers, fruit, level, sky, className }: Props) {
  const id = useId().replace(/:/g, '')
  const box = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  // Nothing animates while the scene is off-screen or the page is hidden.
  useEffect(() => {
    const el = box.current
    let seen = true
    const sync = () => setPaused(!seen || document.hidden)
    const io = typeof IntersectionObserver === 'function' && el ? new IntersectionObserver(([e]) => { seen = e.isIntersecting; sync() }) : null
    if (el) io?.observe(el)
    document.addEventListener('visibilitychange', sync)
    sync()
    return () => { io?.disconnect(); document.removeEventListener('visibilitychange', sync) }
  }, [])
  const layout = flowerLayout(flowers)
  const from = useRef(seenFlowers)
  useEffect(() => { seenFlowers = layout.length; from.current = layout.length }, [layout.length])
  const v = visitors(level)
  const night = sky === 'night'
  const [sx, sy, sc1, sc2] = SUN[sky]
  const place = layout.map((f, i) => {
    const r = rng(i * 31 + 3)
    return { i, k: f.kind, x: 16 + f.x * 368, y: 236 + f.y * 46, rot: (r() - 0.5) * 14, flip: r() > 0.5 ? -1 : 1 }
  }).sort((a, b) => a.y - b.y)
  const old = from.current

  return (
    <div ref={box} className={`garden gs-${sky}${paused ? ' paused' : ''}${className ? ' ' + className : ''}`} role="img"
      aria-label={t('garden.alt', { sky: t(`sky.${sky}`), tree: t(`tree.${stage}`) })}>
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" className="s0" /><stop offset=".62" className="s1" /><stop offset="1" className="s2" /></linearGradient>
          <linearGradient id={`${id}mea`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" className="m0" /><stop offset="1" className="m1" /></linearGradient>
          <radialGradient id={`${id}halo`}><stop offset="0" stopColor={sc1} stopOpacity=".9" /><stop offset=".22" stopColor={sc1} stopOpacity=".5" /><stop offset=".6" stopColor={sc2} stopOpacity=".12" /><stop offset="1" stopColor={sc2} stopOpacity="0" /></radialGradient>
        </defs>
        <rect width="400" height="300" fill={`url(#${id}sky)`} />
        {night ? (
          <>
            {STARS.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.s * 0.6} fill="#fff" opacity={0.5 + (i % 3) * 0.2} />)}
            <circle cx="288" cy="68" r="52" fill={`url(#${id}halo)`} />
            <path d="M296 50a17 17 0 1 0 0 36a13.5 13.5 0 1 1 0-36Z" fill="#fff6d6" />
            <circle cx="282" cy="72" r="2.2" fill="#ead9a8" opacity=".6" />
          </>
        ) : (
          <>
            <circle cx={sx} cy={sy} r="62" fill={`url(#${id}halo)`} />
            <circle cx={sx} cy={sy} r="15" fill={sc1} />
            <circle cx={sx} cy={sy} r="15" fill="none" stroke={sc2} strokeWidth="2" opacity=".5" />
          </>
        )}
        <path d="M0 192C50 170 96 176 150 189S250 178 310 168 380 176 400 184V300H0Z" className="hill1" />
        {[[34, 183, 0.9], [58, 178, 0.7], [338, 174, 0.8], [362, 180, 1]].map(([x, y, s], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${s})`}><rect x="-1" y="0" width="2" height="8" className="hill-trunk" /><path d={blob(0, -3, 8, 90 + i, 7, 0.16)} className="hill-tree" /></g>
        ))}
        <path d="M0 207C70 192 130 201 190 208S320 193 400 201V300H0Z" className="hill2" />
        <path d="M0 222C90 213 150 219 200 220S330 212 400 217V300H0Z" fill={`url(#${id}mea)`} />
        <path d="M0 222C90 213 150 219 200 220S330 212 400 217" className="meadow-edge" fill="none" />
        {Array.from({ length: 26 }, (_, i) => { const x = 8 + i * 15.4 + ((i * 7) % 5), h = 6 + ((i * 5) % 6); return <path key={i} d={`M${x} 300q-1 ${-h * 0.6} ${(i % 2 ? 2.5 : -2.5)} ${-h}M${x + 2} 300q0 ${-h * 0.5} ${(i % 2 ? -1.5 : 3)} ${-h * 0.8}`} className="tuft" /> })}
      </svg>

      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false" className="live">
        <defs>
          <radialGradient id="seedglow"><stop offset="0" stopColor="#ffe9a8" stopOpacity=".75" /><stop offset="1" stopColor="#ffe9a8" stopOpacity="0" /></radialGradient>
          <radialGradient id="flyglow"><stop offset="0" stopColor="#f3ff9a" /><stop offset=".4" stopColor="#d6f26b" stopOpacity=".5" /><stop offset="1" stopColor="#d6f26b" stopOpacity="0" /></radialGradient>
        </defs>
        {!night && <circle cx={sx} cy={sy} r="70" fill={`url(#${id}halo)`} className="sun-pulse" />}
        {night && STARS.filter((_, i) => i % 3 === 0).map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.s * 0.9} fill="#fff" className="twinkle" style={{ animationDelay: `${-i * 0.7}s` }} />)}
        <Cloud x={20} y={62} s={1.1} dur={150} delay={-40} />
        <Cloud x={-40} y={104} s={0.8} dur={190} delay={-120} />
        <Cloud x={-20} y={46} s={0.65} dur={230} delay={-20} />

        <g transform={`translate(200 236) scale(${GROW[Math.min(8, Math.max(0, stage))]}) translate(-200 -236)`}>
          <TreeArt stage={stage} />
          <FruitArt stage={stage} count={fruit} />
        </g>

        {/* Three sway groups (back, middle, front rows) instead of one animation per flower. Rows are contiguous in the y-sorted list, so paint order is kept. */}
        {[0, 1, 2].map((band) => (
          <g key={band} className="flower-sway" style={{ animationDelay: `${-band * 1.5}s` }}>
            {place.filter((p) => Math.min(2, Math.floor(((p.y - 236) / 46) * 3)) === band).map((p) => {
              const fresh = old >= 0 && p.i >= old
              const s = 1.0 + ((p.y - 236) / 46) * 0.6
              return (
                <g key={p.i} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${(s * p.flip).toFixed(2)} ${s.toFixed(2)}) rotate(${p.rot.toFixed(1)})`}>
                  {fresh && <circle cx="0" cy="-12" r="9" className="flower-ring" />}
                  <g className={fresh ? 'flower-in new' : 'flower-in'} style={{ animationDelay: fresh ? '0.7s' : `${Math.min(p.i, 30) * 0.03}s` }}>
                    <FlowerArt kind={p.k} />
                  </g>
                </g>
              )
            })}
          </g>
        ))}

        <rect width="400" height="300" className="tint" />

        {!night && v.butterfly && (
          <g className="fly-butterfly"><g className="bf-bob" transform="scale(1.5)">
            <g className="bf-wings"><path d="M0 0C-4 -7 -11 -6 -9 0C-11 5 -4 5 0 0Z" fill="#f59f3a" /><path d="M0 0C4 -7 11 -6 9 0C11 5 4 5 0 0Z" fill="#f2748b" /><circle cx="-6" cy="-1" r="1.4" fill="#fff" opacity=".8" /><circle cx="6" cy="-1" r="1.4" fill="#fff" opacity=".8" /></g>
            <path d="M0 -3V3" stroke="#3a2a2a" strokeWidth="1.3" strokeLinecap="round" />
          </g></g>
        )}
        {!night && v.bird && (
          <g className="fly-bird"><g className="bird-bob" transform="scale(1.6)">
            <path d="M-6 0Q0 -2 6 0Q0 1 -6 0Z" fill="#4a5568" />
            <g className="wing-l"><path d="M-1 0Q-6 -6 -11 -4Q-6 -2 -1 0Z" fill="#5b6678" /></g>
            <g className="wing-r"><path d="M1 0Q6 -6 11 -4Q6 -2 1 0Z" fill="#5b6678" /></g>
            <circle cx="6.5" cy="-.4" r="1.9" fill="#4a5568" /><path d="M8 -.5L10.4 .2L8 .7Z" fill="#f2b441" />
          </g></g>
        )}
        {!night && v.bees && [0, 1].map((i) => (
          <g key={i} className={`fly-bee b${i}`}><g transform="scale(1.4)">
            <ellipse cx="0" cy="0" rx="3.4" ry="2.4" fill="#f7c02f" /><path d="M-1 -2.2V2.2M1.2 -2.2V2.2" stroke="#2b2a2a" strokeWidth="1" />
            <ellipse cx="-.6" cy="-3" rx="2.4" ry="1.5" fill="#fff" opacity=".7" className="bee-wing" />
          </g></g>
        ))}
        {night && FIREFLIES.map(([x, y, d], i) => (
          <g key={i} transform={`translate(${x} ${y})`}><g className="firefly" style={{ animationDelay: `${-d * 2}s` }}><circle r="9" fill="url(#flyglow)" /><circle r="1.2" fill="#fbffc2" /></g></g>
        ))}
      </svg>
    </div>
  )
}
