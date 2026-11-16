import { useState } from 'react'
import { t } from '../lib/i18n'
import type { AppData } from '../lib/types'
import { FaithFields, PeopleFields, QuitFields, SmokingFields, type Patch } from './fields'
import type { ScreenProps } from './props'
import ImportBox from './ImportBox'
import { Icon } from './ui'

const STEPS = 5

export default function Setup({ data, update, go, corrupt, onImport }: ScreenProps & { corrupt: boolean; onImport: (d: AppData) => void }) {
  const s = data.settings
  const [step, setStep] = useState(0)
  const patch: Patch = (p) => update((d) => ({ ...d, settings: { ...d.settings, ...(typeof p === 'function' ? p(d.settings) : p) } }))
  const finish = () => { patch({ setupDone: true }); go('home') }

  return (
    <main className="page setup">
      {corrupt && (
        <div className="banner" role="alert">
          <p>{t('setup.corrupt')}</p>
          <ImportBox onParsed={onImport} />
        </div>
      )}
      <div className="steps" aria-label={t('setup.step', { n: step + 1, total: STEPS })}>
        {Array.from({ length: STEPS }, (_, i) => <span key={i} className={i <= step ? 'dot on' : 'dot'} />)}
      </div>

      {step === 0 && (
        <section>
          <h1 className="hero">{t('app.name')}</h1>
          <p className="lead">{t('setup.welcome')}</p>
          <p className="muted">{t('setup.welcome2')}</p>
          <div className="chips">
            <button type="button" className={s.lang === 'en' ? 'chip on' : 'chip'} onClick={() => patch({ lang: 'en' })}>English</button>
            <button type="button" className={s.lang === 'ar' ? 'chip on' : 'chip'} onClick={() => patch({ lang: 'ar' })}>العربية</button>
          </div>
          {!corrupt && (
            <details className="restore">
              <summary>{t('setup.restore')}</summary>
              <ImportBox onParsed={onImport} />
            </details>
          )}
        </section>
      )}
      {step === 1 && (<section><h1>{t('setup.s1')}</h1><p className="muted">{t('setup.s1.help')}</p><SmokingFields s={s} patch={patch} /></section>)}
      {step === 2 && (<section><h1>{t('setup.s2')}</h1><QuitFields s={s} patch={patch} setup /></section>)}
      {step === 3 && (<section><h1>{t('setup.s3')}</h1><p className="muted">{t('setup.s3.help')}</p><PeopleFields s={s} patch={patch} /></section>)}
      {step === 4 && (<section><h1>{t('setup.s4')}</h1><p className="muted">{t('setup.s4.help')}</p><FaithFields s={s} patch={patch} /></section>)}

      <div className="setup-nav">
        {step > 0 && <button type="button" className="btn ghost" onClick={() => setStep(step - 1)}><Icon name="back" size={18} /> {t('ui.back')}</button>}
        {step < STEPS - 1
          ? <button type="button" className="btn primary" onClick={() => setStep(step + 1)}>{t('ui.next')}</button>
          : <button type="button" className="btn primary" onClick={finish}>{t('setup.done')}</button>}
      </div>
    </main>
  )
}
