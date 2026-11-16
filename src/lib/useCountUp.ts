import { useEffect, useRef, useState } from 'react'
import { reducedMotion } from './sound'

/** Eases a number from its last shown value to `target` (starts from 0 on first show). */
export function useCountUp(target: number, ms = 900): number {
  const [shown, setShown] = useState(() => (reducedMotion() ? target : 0))
  const from = useRef(shown)
  useEffect(() => {
    if (reducedMotion() || from.current === target) { from.current = target; setShown(target); return }
    const a = from.current, t0 = performance.now()
    let raf = 0
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / ms)
      const v = a + (target - a) * (1 - Math.pow(1 - k, 3))
      from.current = v
      setShown(v)
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return shown
}
