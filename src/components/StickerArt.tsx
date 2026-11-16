import type { ReactNode } from 'react'

const K = '#24403b'
const o = { stroke: K, strokeWidth: 1.4, strokeLinejoin: 'round', strokeLinecap: 'round' } as const
const l = { ...o, fill: 'none' } as const
const SH = 'rgba(36,64,59,.22)'
const HI = 'rgba(255,255,255,.55)'

const LEAF = '#4fa36a'
const DLEAF = '#2f7d4f'
const CREAM = '#fbf1dc'
const BROWN = '#8a5a3b'

const stem = (d: string) => <path d={d} {...l} stroke={DLEAF} strokeWidth={2.4} />
const leaf = (d: string) => <path d={d} fill={LEAF} {...o} />

// petal ring helper: n petals rotated around (cx,cy)
const ring = (n: number, cx: number, cy: number, d: string, fill: string, extra?: ReactNode) =>
  Array.from({ length: n }, (_, i) => (
    <g key={i} transform={`rotate(${(360 / n) * i + (i % 2) * 3} ${cx} ${cy})`}>
      <path d={d} fill={fill} {...o} />
      {extra}
    </g>
  ))

const ART: Record<string, (id: string) => ReactNode> = {
  tulip: () => (
    <>
      {stem('M32 58 C31 50 33 42 32 33')}
      {leaf('M32 56 C22 52 16 42 17 32 C26 36 31 44 32 56Z')}
      {leaf('M32 58 C40 54 46 46 46 38 C38 42 33 48 32 58Z')}
      <path d="M20 13 C19 27 24 37 32 37 C41 37 45 27 44 12 L38 19 L32 9 L26 19 Z" fill="#f0766b" {...o} />
      <path d="M32 9 L38 19 L44 12 C45 27 41 37 33 37 C37 29 36 18 32 9Z" fill={SH} />
      <path d="M24 17 C24 24 26 29 28 31" {...l} stroke={HI} strokeWidth={2} />
    </>
  ),
  robin: () => (
    <>
      <path d="M6 53 C20 50 40 55 58 51" {...l} stroke={BROWN} strokeWidth={2.6} />
      <path d="M45 38 L60 44 L57 49 L42 46Z" fill="#6f5238" {...o} />
      <path d="M14 33 C13 20 23 13 33 15 C43 17 50 27 48 39 C46 49 35 53 26 50 C18 47 14 41 14 33Z" fill="#8f7355" {...o} />
      <path d="M14 33 C13 24 18 17 25 15 C29 25 31 38 27 50 C19 47 14 41 14 33Z" fill="#f08a4b" />
      <path d="M14 33 C13 24 18 17 25 15 C29 25 31 38 27 50 C19 47 14 41 14 33Z" fill="none" {...o} />
      <path d="M14 27 L5 30 L14 32Z" fill="#e8b04a" {...o} />
      <circle cx="21" cy="25" r="2" fill={K} />
      <circle cx="21.6" cy="24.3" r=".6" fill="#fff" />
      <path d="M28 34 C36 30 44 34 46 42 C42 48 34 50 28 47Z" fill="#6f5238" {...o} strokeWidth={1.2} />
      <path d="M26 50 L25 55 M32 51 L33 55" {...l} />
    </>
  ),
  bee: (id) => (
    <>
      <clipPath id={`st-${id}-c`}><ellipse cx="32" cy="38" rx="17" ry="13" /></clipPath>
      <path d="M20 31 C12 16 26 8 31 24Z" fill="#cfe9f5" fillOpacity=".75" {...o} />
      <path d="M43 31 C51 16 38 8 33 24Z" fill="#cfe9f5" fillOpacity=".75" {...o} />
      <path d="M27 14 C24 9 22 8 19 9 M37 14 C40 9 43 8 45 9" {...l} />
      <ellipse cx="32" cy="38" rx="17" ry="13" fill="#f7c02f" {...o} />
      <g clipPath={`url(#st-${id}-c)`}>
        <path d="M24 22 C27 32 27 44 24 54 L30 54 C33 44 33 32 30 22Z" fill={K} />
        <path d="M38 22 C41 32 41 44 38 54 L44 54 C47 44 47 32 44 22Z" fill={K} />
        <path d="M15 45 C25 52 40 52 50 45 L50 52 L15 52Z" fill={SH} />
      </g>
      <ellipse cx="32" cy="38" rx="17" ry="13" fill="none" {...o} />
      <path d="M49 38 L56 38" {...l} strokeWidth={2.2} />
      <path d="M21 31 C23 29 26 28 28 28" {...l} stroke={HI} strokeWidth={2} />
      <circle cx="19" cy="40" r="1.7" fill={K} />
      <path d="M17 44 C19 46 22 46 23 44" {...l} />
    </>
  ),
  rose: () => (
    <>
      {stem('M32 58 C33 50 31 44 32 38')}
      {leaf('M32 52 C42 50 48 44 49 37 C40 38 34 44 32 52Z')}
      {leaf('M32 48 C24 47 18 42 17 36 C25 36 30 41 32 48Z')}
      <path d="M32 8 C44 6 54 15 51 26 C49 36 40 41 32 39 C22 40 13 34 13 24 C13 14 21 9 32 8Z" fill="#d94f70" {...o} />
      <path d="M32 39 C40 41 49 36 51 26 C53 33 46 42 32 41Z" fill={SH} />
      <path d="M22 18 C28 12 40 13 42 22 C43 30 34 33 28 30 C23 27 25 21 31 20 C35 20 37 24 33 26" {...l} />
      <path d="M17 22 C17 17 20 14 24 12" {...l} stroke={HI} strokeWidth={2} />
    </>
  ),
  daisy: () => (
    <>
      {stem('M32 60 C33 52 31 46 32 40')}
      {leaf('M32 54 C40 53 46 48 47 42 C39 42 34 47 32 54Z')}
      {ring(11, 32, 26, 'M32 27 C27 21 28 10 32 8 C36 10 37 21 32 27Z', CREAM)}
      <circle cx="32" cy="26" r="6.5" fill="#f7c02f" {...o} />
      <path d="M33 29 C37 29 39 26 38 22 C39 28 36 32 31 32Z" fill="#d99a14" />
      <path d="M29 23 C30 22 31 22 32 22" {...l} stroke={HI} strokeWidth={1.6} />
    </>
  ),
  sunflower: () => (
    <>
      {stem('M32 60 C31 52 33 46 32 40')}
      {leaf('M32 56 C22 56 15 50 14 43 C23 43 30 48 32 56Z')}
      {leaf('M32 52 C41 52 48 47 50 41 C41 40 34 45 32 52Z')}
      {ring(14, 32, 26, 'M32 21 C28 14 29 8 32 5 C35 8 36 14 32 21Z', '#f7c02f')}
      <circle cx="32" cy="26" r="11" fill={BROWN} {...o} />
      <path d="M32 37 C40 37 44 30 43 24 C44 33 39 40 31 40Z" fill="#5f3a24" />
      <circle cx="28" cy="22" r="1.1" fill="#c99565" />
      <circle cx="33" cy="20" r="1.1" fill="#c99565" />
      <circle cx="37" cy="25" r="1.1" fill="#c99565" />
      <circle cx="30" cy="28" r="1.1" fill="#c99565" />
      <circle cx="35" cy="31" r="1.1" fill="#c99565" />
      <circle cx="26" cy="27" r="1.1" fill="#c99565" />
    </>
  ),
  butterfly: () => (
    <>
      <path d="M31 24 C26 8 10 8 8 20 C7 28 16 33 31 32Z" fill="#8b6fd1" {...o} />
      <path d="M33 24 C38 8 54 8 56 20 C57 28 48 33 33 32Z" fill="#8b6fd1" {...o} />
      <path d="M31 33 C20 33 13 40 17 49 C21 56 29 50 31 40Z" fill="#5b8def" {...o} />
      <path d="M33 33 C44 33 51 40 47 49 C43 56 35 50 33 40Z" fill="#5b8def" {...o} />
      <path d="M31 32 C20 33 15 30 11 25 C18 33 25 36 31 35Z" fill={SH} />
      <circle cx="20" cy="19" r="3.4" fill="#f4a6b8" />
      <circle cx="44" cy="19" r="3.4" fill="#f4a6b8" />
      <circle cx="22" cy="46" r="2.2" fill="#f4a6b8" />
      <circle cx="42" cy="46" r="2.2" fill="#f4a6b8" />
      <path d="M14 14 C16 12 19 11 22 12" {...l} stroke={HI} strokeWidth={2} />
      <path d="M32 20 C31 28 31 40 32 52" {...l} stroke={K} strokeWidth={3.6} />
      <path d="M32 20 C30 12 27 9 24 7 M32 20 C34 12 37 9 40 7" {...l} />
    </>
  ),
  ladybird: () => (
    <>
      <path d="M13 24 L7 20 M13 34 L6 35 M15 45 L9 51 M51 24 L57 20 M51 34 L58 35 M49 45 L55 51" {...l} />
      <path d="M24 12 C28 5 36 5 40 12 C37 15 27 15 24 12Z" fill={K} {...o} />
      <path d="M32 14 C48 12 56 28 52 42 C49 54 40 58 32 58 C23 58 14 54 12 42 C8 28 17 12 32 14Z" fill="#e2483f" {...o} />
      <path d="M32 58 C40 58 49 54 52 42 C54 52 46 60 32 60Z" fill={SH} />
      <path d="M32 14 C31 28 33 44 32 58" {...l} />
      <circle cx="23" cy="28" r="4.4" fill={K} />
      <circle cx="42" cy="26" r="3.8" fill={K} />
      <circle cx="21" cy="43" r="3.4" fill={K} />
      <circle cx="43" cy="42" r="4.2" fill={K} />
      <path d="M18 22 C20 18 24 16 27 16" {...l} stroke={HI} strokeWidth={2.2} />
    </>
  ),
  'watering-can': () => (
    <>
      <path d="M44 32 L58 14" {...l} stroke={K} strokeWidth={5} />
      <path d="M44 32 L58 14" {...l} stroke="#14b8a6" strokeWidth={2.6} />
      <path d="M54 8 L61 15 L57 19 L50 12Z" fill="#14b8a6" {...o} />
      <circle cx="58" cy="26" r="1.2" fill="#5b8def" />
      <circle cx="62" cy="31" r="1.2" fill="#5b8def" />
      <circle cx="57" cy="34" r="1.2" fill="#5b8def" />
      <path d="M14 22 C6 22 6 40 14 42" {...l} strokeWidth={3} />
      <path d="M16 25 C18 14 40 12 42 20 C46 34 46 50 42 55 C36 58 20 58 15 54 C13 44 14 33 16 25Z" fill="#14b8a6" {...o} />
      <path d="M42 20 C46 34 46 50 42 55 C38 56 34 56 31 56 C38 48 38 30 33 17 C38 16 41 17 42 20Z" fill={SH} />
      <ellipse cx="29" cy="17.5" rx="12" ry="3.4" fill="#0e8d7f" {...o} />
      <path d="M17 30 C18 36 18 42 18 48" {...l} stroke={HI} strokeWidth={2.2} />
    </>
  ),
  lantern: (id) => (
    <>
      <defs>
        <radialGradient id={`st-${id}-g`} cx=".5" cy=".5" r=".6">
          <stop offset="0" stopColor="#ffe08a" />
          <stop offset="1" stopColor="#f29a2e" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="8" r="3.4" {...l} />
      <path d="M32 11 L32 14" {...l} />
      <path d="M22 24 C22 17 27 14 32 14 C37 14 42 17 42 24Z" fill="#c9482e" {...o} />
      <path d="M32 14 C37 14 42 17 42 24 L37 24 C37 19 35 16 32 14Z" fill={SH} />
      <path d="M19 24 L45 24 L45 28 L19 28Z" fill="#e0a43a" {...o} />
      <path d="M21 28 C17 36 18 44 24 49 L40 49 C46 44 47 36 43 28Z" fill={`url(#st-${id}-g)`} {...o} />
      <path d="M32 28 L32 49 M26.5 28 C25 36 25.5 43 28 49 M37.5 28 C39 36 38.5 43 36 49" {...l} strokeWidth={1.1} />
      <path d="M22 32 C21 36 21 40 23 43" {...l} stroke={HI} strokeWidth={2} />
      <path d="M21 49 L43 49 L40 54 L24 54Z" fill="#c9482e" {...o} />
      <path d="M32 54 L32 58" {...l} />
      <circle cx="32" cy="59" r="1.6" fill="#e0a43a" {...o} strokeWidth={1} />
    </>
  ),
  mushroom: () => (
    <>
      <path d="M5 57 C20 55 44 55 59 57" {...l} stroke={DLEAF} strokeWidth={2.4} />
      <path d="M24 56 C27 52 25 44 24 36 L40 36 C39 44 37 52 41 56 C34 58 30 58 24 56Z" fill={CREAM} {...o} />
      <path d="M36 37 C37 46 36 52 41 56 C38 57 36 57 34 57 C37 50 36 44 36 37Z" fill={SH} />
      <path d="M7 38 C6 20 18 8 32 8 C47 8 58 20 57 38 C50 41 14 41 7 38Z" fill="#e2483f" {...o} />
      <path d="M44 10 C54 16 58 28 57 38 C54 39.500 50 40 46 40.500 C52 32 52 20 44 10Z" fill={SH} />
      <circle cx="21" cy="19" r="4.4" fill={CREAM} />
      <circle cx="35" cy="14" r="3.2" fill={CREAM} />
      <circle cx="44" cy="27" r="3.8" fill={CREAM} />
      <circle cx="28" cy="31" r="3" fill={CREAM} />
      <circle cx="13" cy="31" r="2.4" fill={CREAM} />
    </>
  ),
  hedgehog: () => (
    <>
      <path d="M10 46 C5 30 14 14 32 12 C48 11 58 26 54 44 C52 50 14 52 10 46Z" fill={BROWN} {...o} />
      <path d="M11 40 L7 36 M13 32 L8 27 M18 24 L14 18 M26 17 L24 11 M35 14 L36 8 M44 17 L47 11 M51 25 L56 21 M54 34 L59 32" {...l} strokeWidth={2} />
      <path d="M30 30 L26 24 M38 30 L38 22 M46 32 L50 26 M22 38 L16 34" {...l} stroke="#5f3a24" strokeWidth={1.6} />
      <path d="M10 46 C14 52 52 50 54 44 C54 48 50 53 44 54 L18 54 C13 53 10 50 10 46Z" fill={SH} />
      <path d="M6 48 C8 38 18 30 28 34 C32 42 26 52 14 54 C8 54 5 51 6 48Z" fill="#e9c9a1" {...o} />
      <circle cx="6.500" cy="49" r="2.4" fill={K} />
      <circle cx="17" cy="40" r="1.8" fill={K} />
      <path d="M24 38 C26 40 26 43 24 45" {...l} strokeWidth={1} />
      <path d="M20 54 L20 58 M44 54 L44 58" {...l} strokeWidth={2.4} />
    </>
  ),
  snail: () => (
    <>
      <path d="M6 54 C10 50 20 52 30 50 C42 52 54 54 58 50 L58 54 C50 58 14 58 6 54Z" fill="#e0b88a" {...o} />
      <path d="M8 53 C6 40 10 34 14 34 C20 36 22 44 20 52Z" fill="#e0b88a" {...o} />
      <path d="M11 35 L8 24 M16 36 L18 25" {...l} />
      <circle cx="8" cy="23" r="1.8" fill={K} />
      <circle cx="18" cy="24" r="1.8" fill={K} />
      <path d="M26 52 C16 40 22 14 40 12 C54 11 60 28 54 42 C50 50 40 54 30 52Z" fill="#e8964a" {...o} />
      <path d="M54 42 C50 50 40 54 30 52 C40 52 50 46 52 34 C54 36 55 39 54 42Z" fill={SH} />
      <path d="M34 44 C26 38 28 22 40 22 C48 22 50 32 44 36 C40 38 36 36 38 31 C39 29 42 29 42 31" {...l} />
      <path d="M26 22 C29 16 34 14 38 14" {...l} stroke={HI} strokeWidth={2} />
    </>
  ),
  dragonfly: () => (
    <>
      <path d="M31 22 C20 10 6 12 4 20 C8 26 22 26 31 24Z" fill="#cfe9f5" fillOpacity=".75" {...o} />
      <path d="M33 22 C44 10 58 12 60 20 C56 26 42 26 33 24Z" fill="#cfe9f5" fillOpacity=".75" {...o} />
      <path d="M31 27 C21 28 8 32 8 38 C14 42 24 36 31 30Z" fill="#cfe9f5" fillOpacity=".75" {...o} />
      <path d="M33 27 C43 28 56 32 56 38 C50 42 40 36 33 30Z" fill="#cfe9f5" fillOpacity=".75" {...o} />
      <path d="M6 20 L14 19.500 M12 36 L18 35" {...l} strokeWidth={1} stroke="#5b8def" />
      <path d="M32 26 C30 34 31 46 32 58 C33 46 34 34 32 26Z" fill="#14b8a6" {...o} />
      <path d="M30 34 L34 34 M30.500 40 L33.500 40 M31 46 L33 46" {...l} strokeWidth={1.2} />
      <path d="M32 26 C34 34 33 46 32 58" fill="none" stroke={SH} strokeWidth={2} />
      <path d="M27 18 C27 12 37 12 37 18 C37 24 27 24 27 18Z" fill="#14b8a6" {...o} />
      <circle cx="28.500" cy="15.500" r="2.200" fill="#f7c02f" {...o} strokeWidth={1} />
      <circle cx="35.500" cy="15.500" r="2.200" fill="#f7c02f" {...o} strokeWidth={1} />
      <path d="M26 22 C27 24 29 25 32 25 C35 25 37 24 38 22 L32 28Z" fill="#14b8a6" {...o} strokeWidth={1} />
    </>
  ),
  lavender: () => (
    <>
      {stem('M32 60 C32 48 31 36 31 22')}
      {stem('M31 60 C26 48 22 38 20 28')}
      {stem('M33 60 C38 48 42 38 45 30')}
      {leaf('M32 58 C24 56 18 50 16 44 C24 45 30 50 32 58Z')}
      {[[31, 8], [20, 14], [45, 16]].map(([x, y], i) => (
        <g key={i}>
          {[0, 1, 2, 3, 4].map((j) => (
            <g key={j}>
              <path d={`M${x - 3.500} ${y + j * 4.200 + 2} C${x - 4} ${y + j * 4.200 - 3} ${x + 3} ${y + j * 4.200 - 3} ${x + 3.500} ${y + j * 4.200 + 2} C${x + 2} ${y + j * 4.200 + 5} ${x - 2} ${y + j * 4.200 + 5} ${x - 3.500} ${y + j * 4.200 + 2}Z`} fill={j % 2 ? '#8b6fd1' : '#a58ae0'} {...o} strokeWidth={1.1} />
            </g>
          ))}
        </g>
      ))}
    </>
  ),
  poppy: () => (
    <>
      {stem('M32 60 C33 52 31 44 32 36')}
      {leaf('M32 54 C40 52 46 46 47 40 C39 41 34 47 32 54Z')}
      <path d="M12 22 C8 10 22 6 30 14 C26 24 20 32 12 22Z" fill="#e2483f" {...o} />
      <path d="M52 22 C56 10 42 6 34 14 C38 24 44 32 52 22Z" fill="#e2483f" {...o} />
      <path d="M14 26 C6 34 14 46 28 40 C34 34 30 24 22 22Z" fill="#ee5f50" {...o} />
      <path d="M50 26 C58 34 50 46 36 40 C30 34 34 24 42 22Z" fill="#d93a33" {...o} />
      <path d="M22 40 C26 44 38 44 42 40 C38 46 26 46 22 40Z" fill={SH} />
      <circle cx="32" cy="28" r="6" fill={K} {...o} />
      <path d="M26 28 L22 26 M38 28 L42 26 M32 22 L32 18 M28 33 L26 36 M36 33 L38 36" {...l} strokeWidth={1.1} />
      <path d="M12 18 C13 14 16 11 20 11" {...l} stroke={HI} strokeWidth={2} />
    </>
  ),
  jasmine: () => (
    <>
      <path d="M8 58 C16 46 14 34 24 28 C34 22 46 24 54 12" {...l} stroke={DLEAF} strokeWidth={2.2} />
      {leaf('M16 44 C8 42 6 34 8 30 C14 32 18 38 16 44Z')}
      {leaf('M40 24 C46 30 52 30 56 28 C54 22 46 20 40 24Z')}
      {ring(5, 24, 24, 'M24 24 C19 18 21 8 24 6 C27 8 29 18 24 24Z', '#fffaf0')}
      <circle cx="24" cy="24" r="2.800" fill="#f7c02f" {...o} strokeWidth={1} />
      <g transform="translate(23 30) scale(.7)">{ring(5, 24, 24, 'M24 24 C19 18 21 8 24 6 C27 8 29 18 24 24Z', '#fffaf0')}</g>
      <circle cx="39" cy="41" r="1.600" fill="#f7c02f" />
      <path d="M46 36 C42 42 44 50 48 50 C52 48 50 40 46 36Z" fill="#f4a6b8" {...o} strokeWidth={1.1} />
      <path d="M20 12 C22 10 24 9 25 10" {...l} stroke={HI} strokeWidth={1.600} />
    </>
  ),
  lotus: () => (
    <>
      <path d="M4 52 C20 48 44 48 60 52" {...l} stroke="#5b8def" strokeWidth={2} />
      <path d="M8 56 C24 53 40 53 56 56" {...l} stroke="#5b8def" strokeWidth={1.400} />
      <path d="M32 50 C20 40 8 38 6 30 C14 28 26 34 32 50Z" fill="#f4a6b8" {...o} />
      <path d="M32 50 C44 40 56 38 58 30 C50 28 38 34 32 50Z" fill="#f4a6b8" {...o} />
      <path d="M32 50 C20 36 22 20 32 8 C42 20 44 36 32 50Z" fill="#f08cab" {...o} />
      <path d="M32 50 C26 40 26 28 32 18 C38 28 38 40 32 50Z" fill="#fbc7d4" {...o} />
      <path d="M32 50 C38 40 38 28 32 18 C40 28 40 40 32 50Z" fill={SH} />
      <path d="M30 14 C27 20 26 26 27 31" {...l} stroke={HI} strokeWidth={2} />
      <path d="M12 54 C18 48 30 52 34 54 C26 58 16 58 12 54Z" fill="#14b8a6" {...o} />
    </>
  ),
  palm: () => (
    <>
      <path d="M30 60 C35 48 29 36 33 24 L38 25 C35 36 40 48 38 60Z" fill={BROWN} {...o} />
      <path d="M31 52 L36 50 M32 44 L37 42 M32 36 L37 34 M33 29 L37 28" {...l} stroke="#5f3a24" strokeWidth={1.1} />
      <path d="M36 24 C28 12 14 14 6 24 C16 18 26 20 36 26Z" fill={LEAF} {...o} />
      <path d="M36 24 C44 12 56 14 60 26 C52 20 44 20 36 26Z" fill={LEAF} {...o} />
      <path d="M36 24 C32 12 38 6 44 6 C42 12 40 18 36 26Z" fill={DLEAF} {...o} />
      <path d="M36 24 C28 18 20 8 14 6 C20 14 28 22 36 26Z" fill={DLEAF} {...o} />
      <path d="M36 24 C30 24 22 28 16 38 C26 30 32 28 36 26Z" fill={LEAF} {...o} />
      <path d="M36 24 C42 24 50 28 54 38 C46 30 40 28 36 26Z" fill={LEAF} {...o} />
      <circle cx="33" cy="30" r="2.800" fill="#b5651d" {...o} strokeWidth={1.100} />
      <circle cx="38" cy="31" r="2.800" fill="#c9772a" {...o} strokeWidth={1.100} />
      <circle cx="35.500" cy="35" r="2.800" fill="#b5651d" {...o} strokeWidth={1.100} />
      <circle cx="31" cy="35" r="2.600" fill="#c9772a" {...o} strokeWidth={1.100} />
    </>
  ),
  hoopoe: () => (
    <>
      <path d="M38 40 L52 55 L46 57 L34 46Z" fill="#6f5238" {...o} />
      <path d="M30 56 L30 60 M37 54 L38 59" {...l} />
      <path d="M36 14 C30 10 26 12 24 18 C24 28 22 36 24 42 C28 52 42 54 48 44 C52 34 46 20 36 14Z" fill="#e8a56a" {...o} />
      <path d="M40 18 C50 24 52 34 48 44 C44 52 36 54 30 52 C42 48 44 30 40 18Z" fill={SH} />
      <path d="M28 28 C38 26 50 32 52 44 C42 50 30 46 28 28Z" fill="#2c2f33" {...o} />
      <path d="M31 31 C39 30 47 34 50 40 M30 38 C38 37 45 40 48 46" {...l} stroke={CREAM} strokeWidth={2.400} />
      <path d="M25 17 C17 12 12 8 8 3 C16 3 24 8 30 13Z" fill="#e8a56a" {...o} />
      <path d="M8 3 C11 3 13 4 15 5 C12 6 10 5 8 3Z" fill={K} {...o} strokeWidth={1} />
      <path d="M28 14 C24 9 22 6 22 2 C27 5 31 8 33 13Z" fill="#e8a56a" {...o} />
      <path d="M22 2 C24 2 26 3 27 5 C25 6 23 5 22 2Z" fill={K} {...o} strokeWidth={1} />
      <path d="M24 20 C16 22 8 20 2 14 C10 12 18 15 25 16Z" fill="#e8a56a" {...o} />
      <path d="M2 14 C5 12 8 12 10 13 C8 15 5 16 2 14Z" fill={K} {...o} strokeWidth={1} />
      <path d="M24 20 C17 23 11 29 6 40 C12 34 18 30 24 26Z" fill="#6f5238" {...o} strokeWidth={1.200} />
      <circle cx="26" cy="19" r="1.800" fill={K} />
      <circle cx="26.600" cy="18.400" r=".6" fill="#fff" />
    </>
  ),
  bluebell: () => (
    <>
      {stem('M16 60 C14 40 22 18 44 14')}
      {leaf('M18 58 C24 52 30 50 36 52 C32 58 24 60 18 58Z')}
      {[[26, 21, 0], [36, 16, 0], [22, 33, 0], [17, 45, 0]].map(([x, y], i) => (
        <g key={i}>
          <path d={`M${x} ${y} L${x + 4} ${y + 6}`} {...l} stroke={DLEAF} />
          <path d={`M${x + 4} ${y + 5} C${x - 1} ${y + 7} ${x - 2} ${y + 14} ${x - 4} ${y + 16} C${x} ${y + 17} ${x + 4} ${y + 15} ${x + 8} ${y + 17} C${x + 8} ${y + 14} ${x + 9} ${y + 8} ${x + 4} ${y + 5}Z`} fill={i % 2 ? '#7c8fe6' : '#5b8def'} {...o} />
        </g>
      ))}
      <path d="M44 14 C46 12 48 12 50 14" {...l} stroke={DLEAF} />
      <circle cx="49" cy="15" r="2.200" fill="#9db6f5" {...o} strokeWidth={1.100} />
    </>
  ),
  frog: () => (
    <>
      <path d="M6 56 C14 54 50 54 58 56" {...l} stroke={DLEAF} strokeWidth={2.400} />
      <path d="M8 52 C4 44 8 38 14 40 C18 44 20 50 22 52Z" fill="#3f9760" {...o} />
      <path d="M56 52 C60 44 56 38 50 40 C46 44 44 50 42 52Z" fill="#3f9760" {...o} />
      <path d="M32 22 C48 22 54 36 50 48 C47 55 17 55 14 48 C10 36 16 22 32 22Z" fill={LEAF} {...o} />
      <path d="M50 48 C47 55 17 55 14 48 C20 52 44 52 50 44Z" fill={SH} />
      <path d="M22 44 C28 50 38 50 44 44" fill="#e8f3d9" />
      <circle cx="22" cy="21" r="7.500" fill={LEAF} {...o} />
      <circle cx="42" cy="21" r="7.500" fill={LEAF} {...o} />
      <circle cx="22" cy="20" r="3.600" fill={CREAM} {...o} strokeWidth={1.100} />
      <circle cx="42" cy="20" r="3.600" fill={CREAM} {...o} strokeWidth={1.100} />
      <circle cx="22.800" cy="20.500" r="1.800" fill={K} />
      <circle cx="41.200" cy="20.500" r="1.800" fill={K} />
      <path d="M18 36 C26 42 38 42 46 36" {...l} />
      <path d="M30 31 L30.500 31 M34 31 L34.500 31" {...l} strokeWidth={1.800} />
      <circle cx="19" cy="42" r="2" fill="#f4a6b8" />
      <circle cx="45" cy="42" r="2" fill="#f4a6b8" />
      <path d="M18 56 L12 58 M46 56 L52 58" {...l} strokeWidth={2.400} />
    </>
  ),
  acorn: () => (
    <>
      <path d="M32 8 C32 5 34 4 36 4" {...l} stroke={BROWN} strokeWidth={2.200} />
      <path d="M32 30 C20 30 14 36 18 46 C22 56 28 58 32 59 C36 58 42 56 46 46 C50 36 44 30 32 30Z" fill="#d9a05b" {...o} />
      <path d="M46 46 C42 56 36 58 32 59 C38 52 40 40 38 31 C46 32 50 38 46 46Z" fill={SH} />
      <path d="M22 38 C21 44 23 49 26 52" {...l} stroke={HI} strokeWidth={2.200} />
      <path d="M10 30 C8 16 20 8 32 8 C44 8 56 16 54 30 C46 34 18 34 10 30Z" fill={BROWN} {...o} />
      <path d="M44 10 C54 14 56 24 54 30 C52 31 50 32 47 33 C52 26 50 16 44 10Z" fill={SH} />
      <path d="M16 16 L24 28 M26 12 L32 31 M38 11 L34 31 M48 16 L40 29 M12 24 L26 18 M22 31 L40 20 M30 11 L52 26" {...l} stroke="#5f3a24" strokeWidth={1} />
      <path d="M17 14 C20 11 24 10 27 10" {...l} stroke={HI} strokeWidth={2} />
    </>
  ),
  wheelbarrow: () => (
    <>
      <path d="M20 26 C18 20 26 20 24 14 C30 16 28 22 32 24 C34 18 40 18 40 12 C46 18 42 24 38 28Z" fill={LEAF} {...o} />
      <path d="M26 28 C20 28 16 28 12 28 C16 30 22 30 28 30Z" fill={DLEAF} {...o} />
      <path d="M10 28 C22 24 42 24 54 28 L48 44 C40 48 24 48 18 44Z" fill="#d9703f" {...o} />
      <path d="M12 28 C24 26 40 26 52 28 C42 32 22 32 12 28Z" fill="#5f3a24" {...o} />
      <path d="M52 28 L48 44 C44 46 40 47 36 47.500 C44 42 48 34 52 28Z" fill={SH} />
      <path d="M16 31 C17 35 19 38 20 40" {...l} stroke={HI} strokeWidth={2} />
      <path d="M52 30 L62 22 M18 44 L8 36" {...l} stroke={BROWN} strokeWidth={3} />
      <path d="M44 46 L50 58 M26 47 L20 58" {...l} stroke={BROWN} strokeWidth={3} />
      <circle cx="14" cy="50" r="7" fill="#9ca8a4" {...o} />
      <circle cx="14" cy="50" r="2.200" fill={CREAM} {...o} strokeWidth={1.100} />
      <path d="M8 46 C10 43 12 42 15 42" {...l} stroke={HI} strokeWidth={1.600} />
    </>
  ),
}

const FALLBACK: (id: string) => ReactNode = () => (
  <>
    {stem('M32 58 C32 48 34 38 32 28')}
    {leaf('M32 54 C16 52 10 36 14 22 C28 24 34 40 32 54Z')}
    {leaf('M33 40 C46 38 52 28 50 16 C38 18 32 28 33 40Z')}
  </>
)

export default function StickerArt({ id, size = 64, silhouette = false }: { id: string; size?: number; silhouette?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" className={silhouette ? 'sticker-art sil' : 'sticker-art'}>
      {(ART[id] ?? FALLBACK)(id)}
    </svg>
  )
}
