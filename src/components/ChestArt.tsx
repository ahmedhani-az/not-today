/** A little wooden chest. `open` swings the lid up; `ready` lets it glow and bob; locked is dimmed. */
export default function ChestArt({ open, ready, shaking }: { open?: boolean; ready?: boolean; shaking?: boolean }) {
  return (
    <svg className={`chest${ready ? ' rdy' : ''}${open ? ' open' : ''}${shaking ? ' shaking' : ''}`} viewBox="0 0 72 64" width="72" height="64" aria-hidden="true">
      <ellipse cx="36" cy="59" rx="26" ry="3.5" fill="#0b3b2a" opacity=".18" />
      {open && <path className="chest-light" d="M14 34L4 4h64L58 34Z" fill="#ffe9a8" opacity=".55" />}
      <rect x="10" y="30" width="52" height="27" rx="4" fill="#a8683a" stroke="#6a3f22" strokeWidth="1.6" />
      <path d="M10 41h52" stroke="#6a3f22" strokeWidth="1.2" opacity=".5" />
      <rect x="10" y="30" width="52" height="6" fill="#8a532d" opacity=".5" />
      <rect x="17" y="30" width="7" height="27" fill="#f2b441" stroke="#b9781c" strokeWidth="1" />
      <rect x="48" y="30" width="7" height="27" fill="#f2b441" stroke="#b9781c" strokeWidth="1" />
      <g className="chest-lid">
        <path d="M9 30Q9 12 36 12Q63 12 63 30Z" fill="#c07b45" stroke="#6a3f22" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M15 27Q16 18 30 16" stroke="#e3a674" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".8" />
        <rect x="17" y="14" width="7" height="16" fill="#f2b441" stroke="#b9781c" strokeWidth="1" />
        <rect x="48" y="14" width="7" height="16" fill="#f2b441" stroke="#b9781c" strokeWidth="1" />
      </g>
      <rect x="31" y="29" width="10" height="11" rx="2.4" fill="#f7c85a" stroke="#b9781c" strokeWidth="1.2" />
      <circle cx="36" cy="34" r="1.7" fill="#7a4a12" /><path d="M36 35v3" stroke="#7a4a12" strokeWidth="1.3" strokeLinecap="round" />
      {ready && <><path className="spk s1" d="M8 12l1.4 3.2L12.6 16.6 9.4 18 8 21 6.6 18 3.4 16.6 6.6 15.2Z" fill="#fff2b3" /><path className="spk s2" d="M62 8l1.2 2.6 2.6 1.2-2.6 1.2L62 15.6l-1.2-2.6-2.6-1.2 2.6-1.2Z" fill="#fff2b3" /></>}
    </svg>
  )
}
