import { Component, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { getLang, t } from './lib/i18n'
import { parseImport, saveData } from './lib/store'
import ImportBox from './screens/ImportBox'
import './styles.css'

/** Last resort: a plain card instead of an empty page. */
class Boundary extends Component<{ children: ReactNode }, { failed: boolean; restore: boolean }> {
  state = { failed: false, restore: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (!this.state.failed) return this.props.children
    // Pasting a backup here overwrites the stored data, then reloads; the card itself must not throw.
    const restore = (d: NonNullable<ReturnType<typeof parseImport>>) => { if (saveData(d)) location.reload() }
    return (
      <main className="page" dir={getLang() === 'ar' ? 'rtl' : 'ltr'}>
        <section className="card" role="alert">
          <h1>{t('err.title')}</h1>
          <p>{t('err.body')}</p>
          <button className="btn primary wide" onClick={() => location.reload()}>{t('err.reload')}</button>
          <button className="btn ghost wide" onClick={() => this.setState({ restore: !this.state.restore })}>{t('setup.import')}</button>
          {this.state.restore && <ImportBox onParsed={restore} />}
        </section>
      </main>
    )
  }
}

createRoot(document.getElementById('root')!).render(<Boundary><App /></Boundary>)
