import { useId, useState } from 'react'
import { downscale } from '../lib/photo'
import { fmtDate, fromDateInput, toDateInput } from '../lib/format'
import { midnightIn, suggestQuitDate, validQuitDate } from '../lib/progress'
import { t } from '../lib/i18n'
import type { Kid, Settings } from '../lib/types'
import { Check, NumField, TextField } from './ui'

export type Patch = (p: Partial<Settings> | ((s: Settings) => Partial<Settings>)) => void
export interface FieldsProps { s: Settings; patch: Patch }

export function SmokingFields({ s, patch }: FieldsProps) {
  return (
    <>
      <NumField label={t('set.cigs')} value={s.cigsPerDay} onChange={(n) => patch({ cigsPerDay: n })} />
      <NumField label={t('set.price')} value={s.packPrice} onChange={(n) => patch({ packPrice: n })} />
      <NumField label={t('set.size')} value={s.packSize} onChange={(n) => patch({ packSize: n })} />
    </>
  )
}

/** Setup commits plausible dates as they are typed; Settings holds the new date until the user confirms. */
export function QuitFields({ s, patch, setup }: FieldsProps & { setup?: boolean }) {
  const id = useId()
  const [txt, setTxt] = useState(toDateInput(s.quitAt))
  const [pending, setPending] = useState<number | null>(null)
  const set = (at: number) => { setTxt(toDateInput(at)); patch({ quitAt: at }) }
  const onDate = (v: string) => {
    setTxt(v)
    const at = fromDateInput(v)
    if (at === null || !validQuitDate(at, Date.now())) return
    if (setup) patch({ quitAt: at })
    else setPending(at === s.quitAt ? null : at)
  }
  const cancel = () => { setPending(null); setTxt(toDateInput(s.quitAt)) }
  const setTime = (i: number, v: string) => patch({ commute: s.commute.map((x, j) => (j === i ? v : x)) })
  return (
    <>
      <div className="field">
        <label htmlFor={id}>{t('set.quit')}</label>
        <input id={id} type="date" value={txt} onChange={(e) => onDate(e.target.value)} onBlur={() => { if (!pending) setTxt(toDateInput(s.quitAt)) }} />
        <small>{fmtDate(s.quitAt, s.lang)}</small>
      </div>
      {pending !== null && (
        <div className="note" role="alertdialog" aria-label={t('set.quit.confirm', { date: fmtDate(pending, s.lang) })}>
          <p>{t('set.quit.confirm', { date: fmtDate(pending, s.lang) })}</p>
          <div className="row">
            <button type="button" className="btn primary" onClick={() => { set(pending); setPending(null) }}>{t('set.quit.change')}</button>
            <button type="button" className="btn ghost" onClick={cancel}>{t('ui.cancel')}</button>
          </div>
        </div>
      )}
      {setup && (
        <div className="chips">
          <button type="button" className="chip" onClick={() => set(suggestQuitDate(Date.now()))}>{t('set.quit.week')}</button>
          <button type="button" className="chip" onClick={() => set(Date.now())}>{t('set.quit.now')}</button>
          <button type="button" className="chip" onClick={() => set(midnightIn(Date.now(), 1))}>{t('set.quit.tomorrow')}</button>
        </div>
      )}
      <p className="muted">{t('set.quit.help')}</p>
      <h3>{t('set.commute')}</h3>
      <p className="muted">{t('set.commute.help')}</p>
      {s.commute.map((v, i) => (
        <div className="row" key={i}>
          <input type="time" aria-label={t('set.commute.time', { n: i + 1 })} value={v} onChange={(e) => setTime(i, e.target.value)} />
          <button type="button" className="btn ghost" onClick={() => patch({ commute: s.commute.filter((_, j) => j !== i) })}>{t('ui.remove')}</button>
        </div>
      ))}
      <button type="button" className="btn ghost" onClick={() => patch({ commute: [...s.commute, '08:00'] })}>{t('set.commute.add')}</button>
    </>
  )
}

export function PeopleFields({ s, patch }: FieldsProps) {
  // functional so text typed while a photo is being decoded is not reverted
  const setKid = (i: number, k: Partial<Kid>) => patch((c) => ({ kids: c.kids.map((x, j) => (j === i ? { ...x, ...k } : x)) }))
  const onPhoto = (i: number, f?: File) => {
    if (f) downscale(f).then((photo) => setKid(i, { photo })).catch(() => { /* not an image: ignore */ })
  }
  return (
    <>
      {s.kids.map((k, i) => (
        <div className="kid-edit" key={i}>
          <div className="avatar big">{k.photo ? <img src={k.photo} alt="" /> : <span>{k.name.trim().charAt(0) || '?'}</span>}</div>
          <div className="grow">
            <TextField label={t('set.kid.name')} value={k.name} onChange={(v) => setKid(i, { name: v })} />
            <label className="btn ghost file">
              {k.photo ? t('set.kid.change') : t('set.kid.add')}
              <input type="file" accept="image/*" onChange={(e) => { onPhoto(i, e.target.files?.[0]); e.target.value = '' }} />
            </label>
            {k.photo && <button type="button" className="btn ghost" onClick={() => setKid(i, { photo: undefined })}>{t('set.kid.nophoto')}</button>}
            <button type="button" className="btn ghost" onClick={() => patch({ kids: s.kids.filter((_, j) => j !== i) })}>{t('ui.remove')}</button>
          </div>
        </div>
      ))}
      <button type="button" className="btn ghost" onClick={() => patch({ kids: [...s.kids, { name: '', note: '' }] })}>{t('set.kid.addone')}</button>
      <TextField label={t('set.line')} value={s.myLine} multiline onChange={(v) => patch({ myLine: v })} />
      <TextField label={t('set.reward.name')} value={s.reward.name} onChange={(v) => patch({ reward: { ...s.reward, name: v } })} />
      <NumField label={t('set.reward.cost')} value={s.reward.cost} onChange={(n) => patch({ reward: { ...s.reward, cost: n } })} />
    </>
  )
}

export function FaithFields({ s, patch }: FieldsProps) {
  return (
    <>
      <Check label={t('set.faith')} checked={s.faithOn} onChange={(v) => patch({ faithOn: v })} />
      {s.faithOn && (
        <TextField label={t('set.intention')} value={s.intention} multiline placeholder={t('set.intention.ph')}
          onChange={(v) => patch({ intention: v })} />
      )}
    </>
  )
}
