/** Rising tone for 4 s (in), falling for 6 s (out), looped, with a short buzz at each change.
 *  Call from a user gesture. Returns a stop function. */
export function startBreathing(): () => void {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  let ctx: AudioContext | null = null
  let osc: OscillatorNode | null = null
  const timers: number[] = []
  try {
    if (Ctx && fb.sound) { // Sound switch off: no tone, the vibration cues still follow their own switch
      ctx = new Ctx()
      void ctx.resume()
      osc = ctx.createOscillator()
      const gain = ctx.createGain()
      gain.gain.value = 0.07
      osc.type = 'sine'
      osc.connect(gain).connect(ctx.destination)
      osc.start()
    }
  } catch { ctx = null }

  const buzz = () => haptic(60)
  const ramp = (from: number, to: number, secs: number) => {
    if (!ctx || !osc) return
    const now = ctx.currentTime
    osc.frequency.cancelScheduledValues(now)
    osc.frequency.setValueAtTime(from, now)
    osc.frequency.linearRampToValueAtTime(to, now + secs)
  }
  const cycle = () => {
    ramp(220, 330, 4); buzz()
    timers.push(window.setTimeout(() => { ramp(330, 220, 6); buzz() }, 4000))
    timers.push(window.setTimeout(cycle, 10_000))
  }
  cycle()
  return () => {
    timers.forEach(clearTimeout)
    try { osc?.stop() } catch { /* already stopped */ }
    void ctx?.close()
  }
}

// ---- feedback: generated tones and vibration, both switchable in Settings ----

const fb = { sound: true, haptics: true }
export const setFeedback = (sound: boolean, haptics: boolean) => { fb.sound = sound; fb.haptics = haptics }

export const reducedMotion = (): boolean => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

export function haptic(pattern: number | number[] = 15): void {
  if (!fb.haptics || navigator.userActivation?.hasBeenActive === false) return // browsers refuse before the first touch
  try { navigator.vibrate?.(pattern) } catch { /* not supported */ }
}

let shared: AudioContext | null = null
function audio(): AudioContext | null {
  if (navigator.userActivation?.hasBeenActive === false) return null // before the first touch the browser would refuse anyway
  try {
    if (!shared) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return null
      shared = new Ctx()
    }
    if (shared.state === 'suspended') void shared.resume()
    return shared
  } catch { return null }
}
/** Call from a pointerdown: browsers only allow audio after a gesture. */
export const unlockAudio = (): void => { if (fb.sound) audio() }

/** One soft note: sine with a quick attack and a long fall. */
function note(c: AudioContext, freq: number, at: number, len: number, vol: number, glideTo?: number): void {
  const o = c.createOscillator(), g = c.createGain()
  o.type = 'sine'
  o.frequency.setValueAtTime(freq, at)
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, at + len)
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(vol, at + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, at + len)
  o.connect(g).connect(c.destination)
  o.start(at); o.stop(at + len + 0.02)
}

/** A soft bubble pop. */
export function popSound(): void {
  if (!fb.sound) return
  const c = audio()
  if (c) note(c, 520 + Math.random() * 160, c.currentTime, 0.11, 0.09, 150)
}

const C_MAJOR = [523.25, 659.25, 783.99, 1046.5]
/** A bright rising chime. `big` adds a high octave for level-ups. */
export function chime(big = false): void {
  if (!fb.sound) return
  const c = audio()
  if (!c) return
  const t0 = c.currentTime
  C_MAJOR.forEach((f, i) => note(c, f, t0 + i * 0.11, 0.9, 0.08))
  if (big) [1318.5, 1568].forEach((f, i) => note(c, f, t0 + 0.5 + i * 0.12, 1.1, 0.06))
}

/** Tiny sparkle for card flips and chest rewards. */
export function sparkle(): void {
  if (!fb.sound) return
  const c = audio()
  if (!c) return
  const t0 = c.currentTime
  ;[1318.5, 1760, 2093].forEach((f, i) => note(c, f, t0 + i * 0.07, 0.5, 0.045))
}
