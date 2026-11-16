import { leafPath } from './art'

// Five little flowers, each standing on (0,0) and growing up (negative y), about 20 units tall.
const stem = (h: number, bend = 1.4) => `M0 0Q${-bend} ${-h * 0.5} 0 ${-h}`
const petals = (n: number, cy: number, rx: number, ry: number, off: number, fill: string, rot = 0) =>
  Array.from({ length: n }, (_, i) => (
    <ellipse key={i} cx="0" cy={cy - off} rx={rx} ry={ry} fill={fill} transform={`rotate(${rot + (360 / n) * i} 0 ${cy})`} />
  ))

export default function FlowerArt({ kind }: { kind: number }) {
  switch (kind) {
    case 0: // tulip
      return (
        <>
          <path d={stem(14)} fill="none" stroke="#3f8a4f" strokeWidth="1.4" strokeLinecap="round" />
          <path d={`M-.3 -2Q-6.5 -3.5 -5.5 -11Q-1.5 -8 -.3 -2Z`} fill="#4fa36a" />
          <path d={`M.3 -4Q5.5 -5 5 -10.5Q1.6 -8.5 .3 -4Z`} fill="#3f8a4f" />
          <path d="M-4.6 -14Q-5.4 -20.5 -2.7 -22.5L0 -19.2L2.7 -22.5Q5.4 -20.5 4.6 -14Q0 -10.8 -4.6 -14Z" fill="#ef6f7a" />
          <path d="M0 -19.2L2.7 -22.5Q5.4 -20.5 4.6 -14Q2.6 -12.4 0 -12.2Z" fill="#d94f62" />
          <path d="M-3.2 -15Q-3.6 -19 -2.4 -20.4" fill="none" stroke="#ffd0d4" strokeWidth=".9" strokeLinecap="round" />
        </>
      )
    case 1: // daisy
      return (
        <>
          <path d={stem(14, -1.2)} fill="none" stroke="#3f8a4f" strokeWidth="1.3" strokeLinecap="round" />
          <path d={`M0 -3Q5.5 -3.5 6 -9Q1.8 -7.5 0 -3Z`} fill="#4fa36a" />
          {petals(9, -16, 1.7, 3.9, 3.6, '#ffffff')}
          {petals(9, -16, 1.3, 3.2, 3.4, '#e9f4ef', 20)}
          <circle cx="0" cy="-16" r="2.5" fill="#f7c02f" />
          <circle cx="-.7" cy="-16.7" r=".9" fill="#ffe28a" />
        </>
      )
    case 2: // poppy
      return (
        <>
          <path d={stem(15, 2)} fill="none" stroke="#3f8a4f" strokeWidth="1.3" strokeLinecap="round" />
          <path d={`M0 -2Q-6 -2.5 -6.5 -8Q-1.5 -6.5 0 -2Z`} fill="#4fa36a" />
          <circle cx="-2.6" cy="-17.5" r="4" fill="#e8453c" />
          <circle cx="2.8" cy="-17.2" r="4" fill="#d9372f" />
          <circle cx="-1.6" cy="-20.6" r="4" fill="#f0584c" />
          <circle cx="2" cy="-20.2" r="3.6" fill="#e8453c" />
          <circle cx="0" cy="-18.7" r="1.7" fill="#3a2a2a" />
          <path d="M-2.6 -18.7h5.2M0 -21.3v5.2" stroke="#7a5a3a" strokeWidth=".5" strokeLinecap="round" fill="none" />
        </>
      )
    case 3: // lavender
      return (
        <>
          <path d={stem(20, 1.6)} fill="none" stroke="#5b9a63" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M0 -1Q-5 -6 -6.5 -13M0 -1Q4.5 -7 6 -12" fill="none" stroke="#4fa36a" strokeWidth="1.1" strokeLinecap="round" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <g key={i}>
              <ellipse cx={-1.7 - (i % 2) * 0.2} cy={-12.5 - i * 1.6} rx="1.6" ry="1.2" fill={i % 2 ? '#8b6fd1' : '#a58ae6'} transform={`rotate(${-25} ${-1.7} ${-12.5 - i * 1.6})`} />
              <ellipse cx={1.9 + (i % 2) * 0.2} cy={-13.2 - i * 1.6} rx="1.6" ry="1.2" fill={i % 2 ? '#a58ae6' : '#7d5fc4'} transform={`rotate(${25} ${1.9} ${-13.2 - i * 1.6})`} />
            </g>
          ))}
          <ellipse cx="0" cy="-25.5" rx="1.3" ry="1.6" fill="#a58ae6" />
        </>
      )
    default: // marigold
      return (
        <>
          <path d={stem(13, 1)} fill="none" stroke="#3f8a4f" strokeWidth="1.4" strokeLinecap="round" />
          <g transform="translate(0 -2.5) rotate(-35)"><path d={leafPath(7, 2.2)} fill="#4fa36a" /></g>
          <g transform="translate(0 -5) rotate(215) scale(1 -1)"><path d={leafPath(6, 2)} fill="#3f8a4f" /></g>
          {petals(12, -15.5, 1.5, 3.3, 3.2, '#f59f23')}
          {petals(10, -15.5, 1.3, 2.7, 2.5, '#fbc253', 18)}
          <circle cx="0" cy="-15.5" r="2.4" fill="#8a4f24" />
          <circle cx="-.6" cy="-16.2" r=".7" fill="#b9773f" />
        </>
      )
  }
}
