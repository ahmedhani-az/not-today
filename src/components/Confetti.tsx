import { useEffect, useRef } from 'react'
import { reducedMotion } from '../lib/sound'

const COLORS = ['#14b8a6', '#5eead4', '#f6b73c', '#f0766b', '#f4a6b8', '#8b6fd1', '#4fa36a', '#ffffff']

/** A short burst of paper confetti on a canvas that ignores touches. Re-fires when `burst` changes. */
export default function Confetti({ burst, count = 70, origin = 0.35 }: { burst: number; count?: number; origin?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current
    if (!burst || !cv || reducedMotion()) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const w = (cv.width = innerWidth * dpr), h = (cv.height = innerHeight * dpr)
    const g = cv.getContext('2d')
    if (!g) return
    const n = Math.min(count, 90)
    const ps = Array.from({ length: n }, (_, i) => {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.9
      const v = (9 + Math.random() * 9) * dpr
      return {
        x: w / 2 + (Math.random() - 0.5) * 60 * dpr, y: h * origin,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        s: (5 + Math.random() * 6) * dpr, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
        c: COLORS[i % COLORS.length], round: i % 5 === 0, life: 0,
      }
    })
    let raf = 0, last = performance.now()
    const frame = (t: number) => {
      const dt = Math.min(2, (t - last) / 16.7); last = t
      g.clearRect(0, 0, w, h)
      let alive = 0
      for (const p of ps) {
        p.life += dt
        p.vy += 0.38 * dpr * dt; p.vx *= 0.985; p.vy *= 0.985
        p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt
        const fade = Math.max(0, 1 - Math.max(0, p.life - 70) / 40)
        if (fade <= 0 || p.y > h + 20) continue
        alive++
        g.globalAlpha = fade
        g.fillStyle = p.c
        g.save(); g.translate(p.x, p.y); g.rotate(p.r)
        if (p.round) { g.beginPath(); g.arc(0, 0, p.s / 2, 0, 6.3); g.fill() } else g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2 * Math.abs(Math.cos(p.r * 2)) + 1)
        g.restore()
      }
      if (alive) raf = requestAnimationFrame(frame)
      else g.clearRect(0, 0, w, h)
    }
    raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(raf); g.clearRect(0, 0, w, h) }
  }, [burst, count, origin])
  return <canvas ref={ref} className="confetti" aria-hidden="true" />
}
