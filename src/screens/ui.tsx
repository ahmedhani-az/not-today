import { useId, useState, type ReactNode } from 'react'
import { t } from '../lib/i18n'

const PATHS: Record<string, ReactNode> = {
  home: <path d="M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10" />,
  target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r=".6" /></>,
  trophy: <path d="M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H4.5c0 3 1.2 4.5 3.5 5M16 6h3.5c0 3-1.2 4.5-3.5 5M12 13v4M8.5 20h7M10 17h4" />,
  pill: <path d="M10.5 20a4.5 4.5 0 0 1-3.2-7.7l5-5a4.5 4.5 0 0 1 6.4 6.4l-5 5a4.5 4.5 0 0 1-3.2 1.3ZM9.5 9.5l5 5" />,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" /></>,
  back: <path d="m14.5 5-7 7 7 7" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  coin: <><circle cx="12" cy="12" r="8.5" /><path d="M14.5 9.2c-.6-.8-1.5-1.2-2.5-1.2-1.5 0-2.5.8-2.5 1.8 0 2.4 5 1.2 5 3.7 0 1-1 1.8-2.5 1.8-1 0-2-.4-2.5-1.2M12 6.5V8m0 8v1.5" /></>,
  lungs: <path d="M12 4v9M12 12c-.5 2-3 3.5-4.5 3.5C5.5 15.5 4 17 4 18.5 4 19.7 5 20 6 20c3 0 6-1.5 6-6M12 12c.5 2 3 3.5 4.5 3.5 2 0 3.5 1.5 3.5 3 0 1.2-1 1.5-2 1.5-3 0-6-1.5-6-6" />,
  heart: <path d="M12 20s-7.5-4.5-7.5-10A4.2 4.2 0 0 1 12 7.5 4.2 4.2 0 0 1 19.5 10c0 5.5-7.5 10-7.5 10Z" />,
  user: <><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c.5-4 3-6 7-6s6.5 2 7 6" /></>,
  moon: <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  water: <path d="M12 3.5s6 6.2 6 10.5a6 6 0 0 1-12 0C6 9.7 12 3.5 12 3.5Z" />,
  walk: <><circle cx="13" cy="5" r="1.8" /><path d="m10 21 2-6-2.5-2.5L11 8l3 2 3 .5M8 12l2-4M14.5 15l2.5 6" /></>,
  leaf: <path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14ZM5 19l7-7" />,
  call: <path d="M6 4h3l1.5 4-2 1.5a11 11 0 0 0 6 6L16 13.5l4 1.5v3c0 1-1 2-2 2C10 20 4 14 4 6c0-1 1-2 2-2Z" />,
  spark: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />,
}

export function Icon({ name, size = 24 }: { name: string; size?: number }) {
  return (
    <svg className={name === 'back' ? 'icon flip' : 'icon'} width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name] ?? PATHS.spark}
    </svg>
  )
}

export function Page({ title, onBack, children }: { title: string; onBack?: () => void; children: ReactNode }) {
  return (
    <main className="page">
      <header className="page-head">
        {onBack && (
          <button className="icon-btn" onClick={onBack} aria-label={t('ui.back')}><Icon name="back" /></button>
        )}
        <h1>{title}</h1>
      </header>
      {children}
    </main>
  )
}

export function Bar({ pct, label, tick }: { pct: number; label: string; tick?: boolean }) {
  const v = Number.isFinite(pct) ? Math.min(100, Math.max(0, pct)) : 0
  return (
    <div className="bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v)}>
      <div className={tick && v >= 100 ? 'bar-fill done' : 'bar-fill'} style={{ inlineSize: `${v}%` }} />
    </div>
  )
}

export function NumField({ label, value, onChange, hint }: { label: string; value: number; onChange: (n: number) => void; hint?: string }) {
  const id = useId()
  const [txt, setTxt] = useState(value > 0 ? String(value) : '')
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="number" inputMode="decimal" min={0} step="any" value={txt}
        onChange={(e) => {
          const v = e.target.value
          if (v.startsWith('-')) return
          setTxt(v)
          const n = parseFloat(v)
          onChange(Number.isFinite(n) && n > 0 ? n : 0)
        }} />
      {hint && <small>{hint}</small>}
    </div>
  )
}

export function TextField({ label, value, onChange, multiline, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string
}) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {multiline
        ? <textarea id={id} rows={3} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        : <input id={id} type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}
    </div>
  )
}

export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

export function Arabic({ children, big }: { children: ReactNode; big?: boolean }) {
  return <p className={big ? 'ar ar-big' : 'ar'} lang="ar" dir="rtl">{children}</p>
}
