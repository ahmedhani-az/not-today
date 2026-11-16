// Small helpers for the hand-drawn look: a seeded random source and wobbly blobs.

/** mulberry32: the same seed always gives the same drawing. */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const f = (n: number) => Math.round(n * 10) / 10

/** A closed, lumpy circle: n points at slightly different radii joined with smooth curves. */
export function blob(cx: number, cy: number, r: number, seed: number, n = 8, wobble = 0.14): string {
  const rnd = rng(seed)
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.35
    const k = r * (1 + (rnd() - 0.5) * 2 * wobble)
    return [cx + Math.cos(a) * k, cy + Math.sin(a) * k * 0.94] as const
  })
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n]
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`
  }
  return d + 'Z'
}

/** A pointed leaf lying along +x from the origin. */
export const leafPath = (len: number, w: number): string =>
  `M0 0Q${f(len * 0.45)} ${f(-w)} ${f(len)} 0Q${f(len * 0.45)} ${f(w)} 0 0Z`
