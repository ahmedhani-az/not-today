import { useState } from 'react'
import { t } from '../lib/i18n'
import { parseImport } from '../lib/store'
import type { AppData } from '../lib/types'

/** Restore a backup from a file or from pasted text (the Android WebView has no easy file flow). */
export default function ImportBox({ onParsed }: { onParsed: (d: AppData) => void }) {
  const [text, setText] = useState('')
  const [bad, setBad] = useState(false)
  const run = (raw: string) => {
    const parsed = parseImport(raw)
    try {
      if (!parsed) throw new Error('bad backup')
      setBad(false)
      onParsed(parsed)
    } catch {
      setBad(true)
    }
  }
  return (
    <div className="import-box">
      <label className="btn ghost wide file">
        {t('setup.import')}
        <input type="file" accept="application/json,.json"
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) f.text().then(run, () => setBad(true)) }} />
      </label>
      <div className="field">
        <label htmlFor="paste-backup">{t('settings.paste.label')}</label>
        <textarea id="paste-backup" rows={4} value={text} placeholder={t('settings.paste.ph')} onChange={(e) => setText(e.target.value)} />
      </div>
      <button type="button" className="btn ghost wide" disabled={!text.trim()} onClick={() => run(text)}>{t('settings.paste.go')}</button>
      {bad && <p className="warn" role="alert">{t('settings.import.bad')}</p>}
    </div>
  )
}
