import { blob, leafPath, rng } from './art'

export const BASE = { x: 200, y: 236 }

type Crown = { cy: number; rx: number; ry: number; lobes: number }
type Spec = { h: number; w0: number; w1: number; crown: Crown; branches: number; roots: number; blossoms: number }
// Stages 3..8; stages 0..2 (seed, sprout, seedling) are drawn by hand below.
const SPECS: Record<number, Spec> = {
  3: { h: 52, w0: 5, w1: 3, crown: { cy: 186, rx: 24, ry: 19, lobes: 5 }, branches: 0, roots: 0, blossoms: 0 },
  4: { h: 66, w0: 8, w1: 4, crown: { cy: 170, rx: 38, ry: 30, lobes: 6 }, branches: 0, roots: 0, blossoms: 0 },
  5: { h: 78, w0: 12, w1: 6, crown: { cy: 154, rx: 54, ry: 42, lobes: 7 }, branches: 2, roots: 0, blossoms: 4 },
  6: { h: 88, w0: 17, w1: 8, crown: { cy: 140, rx: 72, ry: 53, lobes: 8 }, branches: 2, roots: 2, blossoms: 8 },
  7: { h: 96, w0: 23, w1: 10, crown: { cy: 130, rx: 92, ry: 60, lobes: 9 }, branches: 4, roots: 4, blossoms: 12 },
  8: { h: 104, w0: 31, w1: 12, crown: { cy: 120, rx: 116, ry: 72, lobes: 10 }, branches: 4, roots: 4, blossoms: 16 },
}

const g1 = '#2f7d4f', g2 = '#4fa36a', g3 = '#7ccb7f', g4 = '#b9e8a4'
const bark = '#8a5a3b', barkDark = '#5f3d29', barkLight = '#b07b52'

/** Fruit slots inside the crown: golden-angle spiral, so any count 0..12 looks spread out. */
export function fruitSlots(stage: number): { x: number; y: number; r: number }[] {
  const c = SPECS[Math.min(8, Math.max(3, stage))].crown
  return Array.from({ length: 12 }, (_, i) => {
    const a = i * 2.39996 + 0.6
    const k = 0.32 + 0.5 * Math.sqrt((i + 0.5) / 12)
    return { x: BASE.x + Math.cos(a) * c.rx * k * 0.86, y: c.cy + 3 + Math.sin(a) * c.ry * k * 0.8, r: 2.6 + stage * 0.32 }
  })
}

function Seed() {
  return (
    <g>
      <circle cx="200" cy="224" r="20" fill="url(#seedglow)" className="seed-glow" />
      <path d="M166 239Q170 228 184 224Q200 219 216 224Q230 228 234 239Z" fill="#6b4a35" />
      <path d="M176 232Q190 224 206 225Q219 226 226 232Q212 229 198 229Q186 229 176 232Z" fill="#86603f" opacity=".7" />
      <ellipse cx="177" cy="236" rx="4" ry="2.4" fill="#a39482" /><ellipse cx="224" cy="237" rx="3.2" ry="2" fill="#8c7d6c" />
      <g transform="rotate(-18 200 222)">
        <ellipse cx="200" cy="222.6" rx="5.6" ry="3.7" fill="#b9803f" stroke="#6a4426" strokeWidth=".9" />
        <path d="M196 221Q199 219.6 202 220.4" stroke="#e7bf80" strokeWidth="1" fill="none" strokeLinecap="round" />
      </g>
      <path d="M190 230l1 -1.6M209 231l-1.2 -1.5" stroke="#4a3022" strokeWidth="1" strokeLinecap="round" />
    </g>
  )
}

function Mound({ w }: { w: number }) {
  return <path d={`M${200 - w} 238Q${200 - w * 0.7} 229 200 228Q${200 + w * 0.7} 229 ${200 + w} 238Z`} fill="#6b4a35" />
}

function Sprout() {
  return (
    <g>
      <Mound w={22} />
      <path d="M200 231Q198 224 201 216" stroke="#5fb36a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <g transform="translate(200.6 217) rotate(-150)"><path d={leafPath(13, 5)} fill="#7ccb7f" /><path d="M0 0L10 0" stroke="#4fa36a" strokeWidth=".8" /></g>
      <g transform="translate(200.6 217) rotate(-28)"><path d={leafPath(13, 5)} fill="#8fd88a" /><path d="M0 0L10 0" stroke="#4fa36a" strokeWidth=".8" /></g>
    </g>
  )
}

function Seedling() {
  const pairs: [number, number, number][] = [[226, -160, -22], [214, -170, -12], [201, -150, -32]]
  return (
    <g>
      <Mound w={24} />
      <path d="M200 231Q196 214 201 192" stroke="#4fa36a" strokeWidth="3" fill="none" strokeLinecap="round" />
      {pairs.map(([y, a, b], i) => (
        <g key={i}>
          <g transform={`translate(${200 - (226 - y) * 0.14} ${y}) rotate(${a})`}><path d={leafPath(14 - i * 2, 5.5)} fill={i % 2 ? '#7ccb7f' : '#5fb36a'} /></g>
          <g transform={`translate(${200 - (226 - y) * 0.14} ${y - 1}) rotate(${b})`}><path d={leafPath(15 - i * 2, 5.5)} fill={i % 2 ? '#8fd88a' : '#6fc276'} /></g>
        </g>
      ))}
      <g transform="translate(201 192) rotate(-95)"><path d={leafPath(11, 4.4)} fill="#9be394" /></g>
    </g>
  )
}

function bigTree(stage: number) {
  const s = SPECS[stage]
  const { x, y } = BASE
  const top = y - s.h
  const lean = 2
  const trunk = `M${x - s.w0 * 0.5} ${y}C${x - s.w0 * 0.42} ${y - s.h * 0.35} ${x - s.w1 * 0.5 - 1} ${y - s.h * 0.7} ${x - s.w1 * 0.5 + lean} ${top}L${x + s.w1 * 0.5 + lean} ${top}C${x + s.w1 * 0.5 + 1} ${y - s.h * 0.7} ${x + s.w0 * 0.42} ${y - s.h * 0.35} ${x + s.w0 * 0.5} ${y}Z`
  const { cy, rx, ry, lobes } = s.crown
  const rnd = rng(stage * 101 + 7)
  const R = 0.37 * Math.sqrt(rx * ry) + 2
  const ring = Array.from({ length: lobes }, (_, i) => {
    const a = (i / lobes) * Math.PI * 2 + 0.3
    return { a, cx: x + Math.cos(a) * rx * 0.68, cy: cy + Math.sin(a) * ry * 0.66, r: R * (0.9 + rnd() * 0.25) }
  })
  const back = [{ a: 0, cx: x, cy, r: R * 1.25 }, ...ring]
  const mid = back.filter((b) => b.a === 0 || Math.sin(b.a) < 0.55)
  const lite = ring.filter((b) => Math.cos(b.a) < 0.35 && Math.sin(b.a) < 0.2)
  const sh = rx * 0.05, sv = ry * 0.07
  const branchPts = [[-0.5, 0.62, -0.55, 0.15], [0.5, 0.5, 0.6, 0.1], [-0.2, 0.85, -0.25, -0.35], [0.25, 0.8, 0.3, -0.3]].slice(0, s.branches)
  const specks = Array.from({ length: 12 + stage * 3 }, () => {
    const a = rnd() * Math.PI * 2, k = 0.35 + rnd() * 0.6
    return { x: x + Math.cos(a) * rx * k, y: cy + Math.sin(a) * ry * k, rot: rnd() * 180, up: Math.sin(a) < -0.1 && Math.cos(a) < 0.3 }
  })
  const blos = Array.from({ length: s.blossoms }, () => {
    const a = rnd() * Math.PI * 2, k = 0.3 + rnd() * 0.62
    return { x: x + Math.cos(a) * rx * k, y: cy + Math.sin(a) * ry * k * 0.9 }
  })
  const marks = Array.from({ length: 3 + stage }, () => ({ yy: y - 6 - rnd() * (s.h - 22), dx: (rnd() - 0.5) * s.w0 * 0.5, l: 3 + rnd() * 5 }))
  const root = (dir: number, k: number) => `M${x + dir * s.w0 * 0.3} ${y - 8}Q${x + dir * s.w0 * (0.6 + k * 0.4)} ${y - 1} ${x + dir * (s.w0 * 0.8 + 12 + k * 10)} ${y + 3}Q${x + dir * s.w0 * 0.5} ${y + 1} ${x + dir * s.w0 * 0.1} ${y + 1}Z`
  return (
    <>
      <g className="tree-trunk">
        {s.roots > 0 && [-1, 1].map((d) => <path key={d} d={root(d, 0)} fill={bark} />)}
        {s.roots > 2 && [-1, 1].map((d) => <path key={d} d={root(d, 1)} fill={barkDark} opacity=".75" />)}
        <path d={trunk} fill={bark} />
        <path d={`M${x + s.w0 * 0.12} ${y}C${x + s.w0 * 0.2} ${y - s.h * 0.35} ${x + s.w1 * 0.1} ${y - s.h * 0.7} ${x + s.w1 * 0.1 + lean} ${top}L${x + s.w1 * 0.5 + lean} ${top}C${x + s.w1 * 0.5 + 1} ${y - s.h * 0.7} ${x + s.w0 * 0.42} ${y - s.h * 0.35} ${x + s.w0 * 0.5} ${y}Z`} fill={barkDark} opacity=".28" />
        <path d={`M${x - s.w0 * 0.3} ${y - 3}C${x - s.w0 * 0.28} ${y - s.h * 0.35} ${x - s.w1 * 0.3} ${y - s.h * 0.7} ${x - s.w1 * 0.3 + lean} ${top + 6}`} stroke={barkLight} strokeWidth={Math.max(1, s.w0 * 0.14)} strokeLinecap="round" fill="none" opacity=".6" />
        {marks.map((m, i) => <path key={i} d={`M${x + m.dx} ${m.yy}q1 ${-m.l * 0.5} 0 ${-m.l}`} stroke={barkDark} strokeWidth=".9" strokeLinecap="round" fill="none" opacity=".5" />)}
      </g>
      <g className="tree-crown" style={{ transformOrigin: `${x}px ${cy + ry * 0.7}px` }}>
        {back.map((b, i) => <path key={i} d={blob(b.cx, b.cy, b.r, stage * 13 + i)} fill={g1} />)}
        {branchPts.map(([sx, sy, ex, ey], i) => (
          <path key={i} d={`M${x + sx * 4} ${y - s.h * sy}Q${x + (sx + ex) * rx * 0.2} ${cy + ry * (0.5 + ey)} ${x + ex * rx} ${cy + ry * ey}`} stroke={barkDark} strokeWidth={Math.max(2, s.w1 * 0.4)} strokeLinecap="round" fill="none" />
        ))}
        {mid.map((b, i) => <path key={i} d={blob(b.cx - sh, b.cy - sv, b.r * 0.88, stage * 29 + i)} fill={g2} />)}
        {lite.map((b, i) => <path key={i} d={blob(b.cx - sh * 2, b.cy - sv * 2.4, b.r * 0.55, stage * 41 + i)} fill={g3} />)}
        <path d={blob(x - rx * 0.12, cy - ry * 0.32, R * 0.55, stage * 5)} fill={g3} opacity=".85" />
        {specks.map((p, i) => (
          <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.rot})`}>
            <path d={leafPath(5.5, 2)} fill={p.up ? g4 : g1} opacity={p.up ? 0.7 : 0.55} />
          </g>
        ))}
        {blos.map((b, i) => (
          <g key={i}><circle cx={b.x} cy={b.y} r="2.3" fill="#fde6ee" /><circle cx={b.x} cy={b.y} r=".9" fill="#f2b441" /></g>
        ))}
      </g>
    </>
  )
}

export default function TreeArt({ stage }: { stage: number }) {
  const st = Math.max(0, Math.min(8, stage))
  return (
    <>
      <ellipse cx={BASE.x} cy={BASE.y + 3} rx={[20, 20, 22, 26, 34, 48, 62, 82, 104][st]} ry={[3, 3, 3.5, 4, 5, 6, 7.5, 9, 11][st]} fill="#0b3b2a" opacity=".2" />
      <g className="tree-sway">
        {st === 0 ? <Seed /> : st === 1 ? <Sprout /> : st === 2 ? <Seedling /> : bigTree(st)}
      </g>
    </>
  )
}

/** Fruit are separate so the crown sways under them. */
export function FruitArt({ stage, count }: { stage: number; count: number }) {
  if (stage < 3 || count <= 0) return null
  const slots = fruitSlots(stage).slice(0, Math.min(12, count))
  return (
    <g className="tree-crown fruit" style={{ transformOrigin: `${BASE.x}px ${SPECS[stage].crown.cy + SPECS[stage].crown.ry * 0.7}px` }}>
      {slots.map((f, i) => (
        <g key={i} className="fruit-pop" style={{ animationDelay: `${0.6 + i * 0.08}s`, transformOrigin: `${f.x}px ${f.y - f.r}px` }}>
          <circle cx={f.x} cy={f.y} r={f.r} fill={i % 3 === 1 ? '#ee7b30' : '#f59f3a'} stroke="#c75f1b" strokeWidth=".6" />
          <circle cx={f.x - f.r * 0.35} cy={f.y - f.r * 0.35} r={f.r * 0.28} fill="#ffe6b8" opacity=".9" />
          <path d={`M${f.x} ${f.y - f.r}q${f.r * 0.5} ${-f.r * 0.7} ${f.r * 0.9} ${-f.r * 0.5}`} stroke="#2f7d4f" strokeWidth=".9" fill="none" strokeLinecap="round" />
        </g>
      ))}
    </g>
  )
}
