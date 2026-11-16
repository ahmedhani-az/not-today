import { Capacitor } from '@capacitor/core'
import { useCallback, useEffect, useRef, useState } from 'react'
import { syncBadges } from './lib/achievements'
import { settleMissions, syncLevel } from './lib/game'
import { setLang, t } from './lib/i18n'
import { scheduleAll } from './lib/notify'
import { haptic, setFeedback, unlockAudio } from './lib/sound'
import { loadData, saveData } from './lib/store'
import type { AppData, NotifyStatus } from './lib/types'
import Craving from './screens/Craving'
import Achievements from './screens/Achievements'
import Faith from './screens/Faith'
import Garden from './screens/Garden'
import Health from './screens/Health'
import Home from './screens/Home'
import Kids from './screens/Kids'
import Medicine from './screens/Medicine'
import Moment from './screens/Moment'
import Money from './screens/Money'
import Myself from './screens/Myself'
import type { Screen, ScreenProps } from './screens/props'
import Settings from './screens/Settings'
import Setup from './screens/Setup'
import Triggers from './screens/Triggers'
import { Icon } from './screens/ui'

const NAV: { screen: Screen; icon: string; label: string }[] = [
  { screen: 'home', icon: 'home', label: 'nav.home' },
  { screen: 'triggers', icon: 'target', label: 'nav.triggers' },
  { screen: 'achievements', icon: 'trophy', label: 'nav.achievements' },
  { screen: 'medicine', icon: 'pill', label: 'nav.medicine' },
  { screen: 'settings', icon: 'gear', label: 'nav.settings' },
]
const SUB: Partial<Record<Screen, Screen>> = { money: 'home', health: 'home', kids: 'home', myself: 'home', faith: 'home', garden: 'home' }
const CRAVING: Screen[] = ['craving', 'break', 'slip']

export default function App() {
  const [init] = useState(() => loadData(Date.now()))
  const [data, setData] = useState<AppData>(init.data)
  const dataRef = useRef(init.data)
  const [corrupt, setCorrupt] = useState(init.corrupt)
  const [saveFailed, setSaveFailed] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [screen, setScreen] = useState<Screen>('home')
  const [notify, setNotify] = useState<NotifyStatus | null>(null)
  const [moments, setMoments] = useState<string[]>([])

  // `awarded`: badges the caller gave directly (they get the same new-badge moment as earned ones).
  const commit = useCallback((next: AppData, awarded: string[] = []) => {
    const at = Date.now()
    // Order matters: mission credit first (it adds points), then badges, then the level those points reach.
    const settled = next.settings.setupDone ? settleMissions(next, at) : next
    const { data: badged, fresh } = syncBadges(settled, at)
    const { data: synced, leveledTo } = next.settings.setupDone ? syncLevel(badged, at) : { data: badged, leveledTo: null }
    if (synced === dataRef.current) return
    // A failed save keeps the previous in-memory data, so what the user sees is what is on the device.
    if (!saveData(synced)) { setSaveFailed(true); return }
    dataRef.current = synced
    setData(synced)
    setSaveFailed(false)
    const all = [...awarded, ...fresh, ...(leveledTo ? [`level:${leveledTo}`] : [])]
    if (all.length) setMoments((m) => [...m, ...all])
  }, [])
  const update = useCallback((fn: (d: AppData) => AppData) => commit(fn(dataRef.current)), [commit])
  const award = useCallback((id: string) => {
    const d = dataRef.current
    if (!d.badges.includes(id)) commit({ ...d, badges: [...d.badges, id] }, [id])
  }, [commit])

  useEffect(() => {
    const tick = () => { setNow(Date.now()); commit(dataRef.current) }
    tick()
    const id = setInterval(tick, 30_000)
    document.addEventListener('visibilitychange', tick)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick) }
  }, [commit])

  const s = data.settings
  setLang(s.lang)
  setFeedback(s.sound, s.haptics)
  useEffect(() => {
    // First touch unlocks audio; every button gives a tiny buzz.
    const down = (e: Event) => {
      unlockAudio()
      const b = (e.target as Element | null)?.closest?.('button, a.btn')
      if (b && !(b as HTMLButtonElement).disabled) haptic(6)
    }
    document.addEventListener('pointerdown', down, { capture: true })
    return () => document.removeEventListener('pointerdown', down, { capture: true })
  }, [])
  useEffect(() => { document.documentElement.dataset.theme = s.theme }, [s.theme])
  useEffect(() => { window.scrollTo(0, 0) }, [screen])

  // Android back button: any screen -> Home, Home -> exit.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    let off: (() => void) | undefined
    let dead = false
    void import('@capacitor/app').then(({ App: CapApp }) =>
      CapApp.addListener('backButton', () => (screen === 'home' ? void CapApp.exitApp() : setScreen('home'))).then((h) => {
        if (dead) void h.remove()
        else off = () => void h.remove()
      }))
    return () => { dead = true; off?.() }
  }, [screen])

  // Reminders are rebuilt when what they depend on changes (not on every tick).
  const remindKey = JSON.stringify([s.setupDone, s.lang, s.quitAt, s.med, s.commute, s.replacements, data.events.length, Math.floor(now / 86_400_000)])
  useEffect(() => {
    if (!s.setupDone) return
    let live = true
    void scheduleAll(dataRef.current, Date.now()).then((r) => live && setNotify(r))
    return () => { live = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remindKey])

  const props: ScreenProps = { data, update, award, go: setScreen, now, notify }
  const onImport = (d: AppData) => { commit(d); setCorrupt(false); setScreen('home') }
  const setup = !s.setupDone

  let body
  if (setup) body = <Setup {...props} corrupt={corrupt} onImport={onImport} go={() => setCorrupt(false)} />
  else {
    switch (screen) {
      case 'craving': body = <Craving key="c" {...props} />; break
      case 'break': body = <Craving key="b" {...props} preset="break" />; break
      case 'slip': body = <Craving key="s" {...props} slip />; break
      case 'triggers': body = <Triggers {...props} />; break
      case 'achievements': body = <Achievements {...props} />; break
      case 'medicine': body = <Medicine {...props} />; break
      case 'settings': body = <Settings {...props} />; break
      case 'money': body = <Money {...props} />; break
      case 'health': body = <Health {...props} />; break
      case 'kids': body = <Kids {...props} />; break
      case 'myself': body = <Myself {...props} />; break
      case 'faith': body = <Faith {...props} />; break
      case 'garden': body = <Garden {...props} />; break
      default: body = <Home {...props} />
    }
  }
  const active = SUB[screen] ?? screen

  return (
    <div className="app">
      {saveFailed && <div className="banner" role="alert">{t('app.savefail')}</div>}
      {body}
      {!setup && !CRAVING.includes(screen) && (
        <nav className="nav" aria-label={t('nav.label')}>
          {NAV.map((n) => (
            <button key={n.screen} className={active === n.screen ? 'nav-btn on' : 'nav-btn'} onClick={() => setScreen(n.screen)}
              aria-current={active === n.screen ? 'page' : undefined}>
              <Icon name={n.icon} /><span>{t(n.label)}</span>
            </button>
          ))}
        </nav>
      )}
      {!setup && !CRAVING.includes(screen) && moments[0] && (
        <Moment id={moments[0]} data={data} now={now} onDone={() => setMoments((m) => m.slice(1))} />
      )}
    </div>
  )
}
