import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { TRIGGER_TAGS } from '../lib/content'
import { faithRef, fmtLeft, fmtMoney, kidsTitle, withinAfter } from '../lib/format'
import { t } from '../lib/i18n'
import { cravingsBeaten, monthlySaving, moneySaved, nextMilestone } from '../lib/progress'
import { applyReward, pickReward, popBonus, points, type Reward, flowerCount, shownFruit, shownPoints, shownTreeStage, skyPhase, levelProgress } from '../lib/game'
import { chime, haptic, startBreathing } from '../lib/sound'
import { useCountUp } from '../lib/useCountUp'
import Confetti from '../components/Confetti'
import GardenScene from '../components/GardenScene'
import RewardCard from '../components/RewardCard'
import SmokeGame from '../components/SmokeGame'
import { fmtNum, tn } from '../lib/format'
import type { Replacement, TriggerTag } from '../lib/types'
import type { ScreenProps } from './props'
import { Arabic, Icon } from './ui'

const TOTAL = 300_000
const ROTATE = 15_000
const GUM = ['nicotinell-2', 'nicotine-stop-4']
const pad = (n: number) => String(n).padStart(2, '0')
const clock = (ms: number) => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${pad(s % 60)}` }

type Phase = 'ready' | 'running' | 'won' | 'summary' | 'pick' | 'slipped'

export default function Craving({ data, update, go, now, preset, slip }: ScreenProps & { preset?: TriggerTag; slip?: boolean }) {
  const s = data.settings
  const [trigger, setTrigger] = useState<TriggerTag | undefined>(preset)
  const [drive, setDrive] = useState(() => withinAfter(s.commute, new Date(), 45))
  const [phase, setPhase] = useState<Phase>(slip ? 'pick' : 'ready')
  const [startedAt, setStartedAt] = useState(0)
  const [tick, setTick] = useState(() => Date.now())
  const [offset, setOffset] = useState(0)
  const [count, setCount] = useState(1)
  const [mode, setMode] = useState<'breathe' | 'play'>('breathe')
  const [pops, setPops] = useState(0)
  const popsRef = useRef(0)
  const [reward, setReward] = useState<Reward | null>(null)
  const [flipped, setFlipped] = useState(false)
  const [burst, setBurst] = useState(0)
  const pointsAtStart = useRef(0)
  const wonPops = useRef(0)
  const stopSound = useRef<(() => void) | null>(null)
  const lock = useRef<WakeLockSentinel | null>(null)
  const done = useRef(false)

  const sound = (on: boolean) => {
    stopSound.current?.(); stopSound.current = null
    if (on) stopSound.current = startBreathing()
  }
  const takeLock = useCallback(async () => {
    try { lock.current = (await navigator.wakeLock?.request('screen')) ?? null } catch { /* not allowed: fine */ }
  }, [])
  const release = () => { void lock.current?.release().catch(() => {}); lock.current = null }

  useEffect(() => () => { stopSound.current?.(); void lock.current?.release().catch(() => {}) }, [])

  const running = phase === 'running'
  useEffect(() => {
    if (!running) return
    const upd = () => setTick(Date.now())
    const id = setInterval(upd, 250)
    const vis = () => { upd(); if (document.visibilityState === 'visible') void takeLock() }
    document.addEventListener('visibilitychange', vis)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', vis) }
  }, [running, takeLock])

  const elapsed = running ? Math.min(TOTAL, Math.max(0, tick - startedAt)) : 0
  const left = TOTAL - elapsed

  useEffect(() => {
    if (!running || left > 0 || done.current) return
    done.current = true
    sound(false); release()
    haptic([120, 80, 120]); chime()
    // The win, the pops bonus and the card's prize are saved together, so nothing is lost if the user leaves now.
    let won: Reward | null = null
    wonPops.current = popsRef.current
    update((d) => {
      const at = Date.now()
      const n = { ...d, events: [...d.events, { type: 'win' as const, at, trigger }] }
      const b = { ...n, game: { ...n.game, bonus: n.game.bonus + popBonus(popsRef.current) } }
      won = pickReward(b, at, Math.random)
      return applyReward(b, won)
    })
    setReward(won); setFlipped(false); setBurst((x) => x + 1)
    setPhase('won')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, left])

  const start = () => {
    const at = Date.now()
    done.current = false
    popsRef.current = 0; setPops(0); pointsAtStart.current = points(data, at)
    setStartedAt(at); setTick(at); setPhase('running')
    if (drive) sound(true)
    void takeLock()
  }
  const toggleDrive = () => { setDrive(!drive); if (running) sound(!drive) }
  const stop = () => { sound(false); release() }
  const close = () => { stop(); go('home') }
  const smoked = () => { stop(); setPhase('pick') }
  const logSlip = () => {
    update((d) => ({ ...d, events: [...d.events, { type: 'slip', at: Date.now(), count, trigger }] }))
    setPhase('slipped')
  }

  // what to do right now
  const suggestions: Replacement[] = []
  const has = (ids: string[]) => s.med.plan !== 'none' && s.med.products.some((p) => ids.includes(p))
  if (has(GUM)) suggestions.push('gum')
  if (has(['quickmist'])) suggestions.push('spray')
  const forTrigger = trigger ? s.replacements[trigger] : undefined
  if (forTrigger && !suggestions.includes(forTrigger)) suggestions.push(forTrigger)
  if (!suggestions.length) suggestions.push('breathe')

  // the five motivations
  const cards: ReactNode[] = []
  const photos = s.kids.filter((k) => k.photo || k.name.trim())
  if (photos.length) {
    const note = s.kids.find((k) => k.note.trim())?.note
    cards.push(
      <div key="kids" className="mot">
        <div className="avatars big">{photos.slice(0, 4).map((k, i) => (
          <span className="avatar big" key={i}>{k.photo ? <img src={k.photo} alt={k.name} /> : <span>{k.name.trim().charAt(0)}</span>}</span>
        ))}</div>
        <p className="mot-text">{t('craving.kids', { names: kidsTitle(s.kids, s.lang) })}</p>
        {note && <p className="muted">“{note}”</p>}
      </div>)
  }
  const saved = moneySaved(data, now), month = monthlySaving(s)
  if (saved >= 1) cards.push(<div key="money" className="mot"><p className="mot-big">{fmtMoney(saved, s.lang)}</p><p className="mot-text">{t('craving.money')}</p></div>)
  else if (month >= 1) cards.push(<div key="money" className="mot"><p className="mot-big">{fmtMoney(month, s.lang)}</p><p className="mot-text">{t('craving.month')}</p></div>)
  const verses = s.faithOn ? s.faithTexts.filter((f) => !f.onSlip) : []
  if (verses.length) {
    const f = verses[(Math.floor(elapsed / ROTATE) + offset + cravingsBeaten(data)) % verses.length]
    cards.push(<div key="faith" className="mot"><Arabic big>{f.ar}</Arabic>{s.lang === 'en' && <p className="mot-text">{f.en}</p>}{faithRef(f, s.lang) && <p className="muted">{faithRef(f, s.lang)}</p>}</div>)
  }
  const nm = nextMilestone(data, now)
  if (nm) cards.push(
    <div key="health" className="mot"><p className="mot-text">{t(`ms.${nm.id}.body`)}</p>
      <p className="muted">{t('craving.health', { title: t(`ms.${nm.id}.title`), left: fmtLeft(nm.msLeft) })}</p></div>)
  if (s.myLine.trim()) cards.push(<div key="line" className="mot"><p className="mot-quote">{s.myLine}</p></div>)
  const card = cards.length ? cards[(Math.floor(elapsed / ROTATE) + offset) % cards.length] : null

  const inhale = elapsed % 10_000 < 4000

  if (phase === 'won') return (
    <Shell>
      <Confetti burst={burst} />
      <div className="result reward-stage">
        <p className="eyebrow">{t('craving.won', { n: cravingsBeaten(data) })}</p>
        {reward && <RewardCard reward={reward} data={data} now={Date.now()} onFlip={() => { setFlipped(true); setBurst((x) => x + 1) }} />}
        {!flipped && <p className="muted">{t('reward.hint')}</p>}
        <button className={flipped ? 'btn primary wide' : 'btn ghost wide'} onClick={() => setPhase('summary')}>{t('ui.continue')}</button>
      </div>
    </Shell>
  )
  if (phase === 'summary') return (
    <Shell>
      <Summary earned={Math.max(0, points(data, Date.now()) - pointsAtStart.current)} pops={wonPops.current} beaten={cravingsBeaten(data)} lang={s.lang} onHome={() => go('home')} />
    </Shell>
  )
  if (phase === 'slipped') {
    const mercy = s.faithOn ? s.faithTexts.find((f) => f.onSlip) : undefined
    return (
      <Shell>
        <div className="result">
          <h1>{t('craving.slip.carryon')}</h1>
          {mercy && <><Arabic big>{mercy.ar}</Arabic>{s.lang === 'en' && <p className="lead">{mercy.en}</p>}<p className="muted">{faithRef(mercy, s.lang)}</p></>}
          <p className="note">{t('craving.slip.safe')}</p>
          <button className="btn primary wide" onClick={() => go('home')}>{t('craving.home')}</button>
        </div>
      </Shell>
    )
  }
  if (phase === 'pick') return (
    <Shell>
      <div className="result">
        <h1>{t('craving.slip.title')}</h1>
        <div className="stepper">
          <button className="icon-btn round" onClick={() => setCount(Math.max(1, count - 1))} aria-label={t('craving.fewer')}>−</button>
          <output aria-live="polite" aria-label={t('craving.slip.count')}>{count}</output>
          <button className="icon-btn round" onClick={() => setCount(Math.min(40, count + 1))} aria-label={t('craving.more')}>+</button>
        </div>
        <button className="btn primary wide" onClick={logSlip}>{t('craving.slip.save')}</button>
        {slip
          ? <button className="btn ghost wide" onClick={() => go('home')}>{t('ui.cancel')}</button>
          : <button className="btn ghost wide" onClick={() => { setPhase('running'); sound(drive); void takeLock() }}>{t('craving.keepgoing')}</button>}
      </div>
    </Shell>
  )

  const play = mode === 'play' && !drive
  const photo = s.kids.find((k) => k.photo)?.photo
  const lv = levelProgress(shownPoints(data, now)).level
  const game = (
    <SmokeGame left={left} total={TOTAL} clock={clock(left)} photo={photo} pops={pops}
      onPop={() => { popsRef.current++; setPops(popsRef.current) }}
      scene={<GardenScene className="fill" stage={shownTreeStage(data, now)} flowers={flowerCount(data)} fruit={shownFruit(data, now)} level={lv} sky={skyPhase(now)} />} />
  )
  const orb = (
    <div className={`orb-wrap${drive ? ' drive' : ''}`}>
      {running && <div className="orb" key={startedAt} />}
      {!running && <div className="orb still" />}
      <div className="orb-text">
        <span className="count" role="timer" aria-label={t('craving.left', { time: clock(left) })}>{clock(left)}</span>
        {running && <span className="phase" aria-live="off">{inhale ? t('craving.in') : t('craving.out')}</span>}
      </div>
    </div>
  )

  return (
    <Shell>
      <div className="craving-top">
        <button className="icon-btn" onClick={close} aria-label={t('ui.close')}><Icon name="close" /></button>
        <button className={drive ? 'chip on' : 'chip'} aria-pressed={drive} onClick={toggleDrive}>{t('craving.drive')}</button>
      </div>

      {phase === 'ready' ? (
        <div className="ready">
          <h1>{t('craving.ready')}</h1>
          <p className="lead">{t('craving.ready.sub')}</p>
          {drive && <p className="note">{t('craving.drive.help')}</p>}
          <button className="btn primary wide big-btn" onClick={start}>{t('craving.start')}</button>
          <div>
            <p className="muted">{t('craving.trigger')}</p>
            <div className="chips">
              {TRIGGER_TAGS.map((tag) => (
                <button key={tag} className={trigger === tag ? 'chip on' : 'chip'} aria-pressed={trigger === tag}
                  onClick={() => setTrigger(trigger === tag ? undefined : tag)}>{t(`trigger.${tag}`)}</button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {!drive && (
            <div className="seg" role="group" aria-label={t('craving.mode')}>
              <button className={!play ? 'seg-btn on' : 'seg-btn'} aria-pressed={!play} onClick={() => setMode('breathe')}>{t('craving.breathe')}</button>
              <button className={play ? 'seg-btn on' : 'seg-btn'} aria-pressed={play} onClick={() => setMode('play')}>{t('craving.play')}</button>
            </div>
          )}
          {play ? game : orb}
          {!drive && (
            <>
              <section className="try">
                <p className="eyebrow">{t('craving.try')}</p>
                {suggestions.map((r) => <p key={r} className="try-item">{t(`repl.${r}`)}</p>)}
              </section>
              <section className="card mot-card" onClick={() => setOffset(offset + 1)} aria-live="off">{card}</section>
            </>
          )}
          <button className="btn ghost smoked" onClick={smoked}>{t('craving.smoked')}</button>
        </>
      )}
    </Shell>
  )
}

function Summary({ earned, pops, beaten, lang, onHome }: { earned: number; pops: number; beaten: number; lang: 'en' | 'ar'; onHome: () => void }) {
  const shown = useCountUp(earned, 1200)
  return (
    <div className="result">
      <span className="seal"><Icon name="check" size={44} /></span>
      <h1>{t('craving.won', { n: beaten })}</h1>
      <p className="lead">{t('craving.won.sub')}</p>
      <p className="earned">{t('win.earned', { n: fmtNum(shown, lang) })}</p>
      {pops > 0 && <p className="muted">{tn('win.pops', pops)}</p>}
      <button className="btn primary wide" onClick={onHome}>{t('craving.home')}</button>
    </div>
  )
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="craving"><div className="craving-in">{children}</div></div>
}
