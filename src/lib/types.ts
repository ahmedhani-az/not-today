export type Lang = 'en' | 'ar'
export type Theme = 'light' | 'dark'
export type TriggerTag = 'food' | 'coffee' | 'car' | 'stress' | 'break' | 'smokers' | 'other'
export type Replacement = 'gum' | 'spray' | 'water' | 'walk' | 'wudu' | 'pray' | 'call' | 'breathe'
export type EventType = 'smoke' | 'win' | 'slip' | 'dose'
export interface AppEvent { type: EventType; at: number; trigger?: TriggerTag; count?: number; product?: string; slot?: string }
export interface FaithText { id: string; ar: string; en: string; ref: string; refAr?: string; kind: 'verse' | 'hadith' | 'dua' | 'dhikr'; onSlip?: boolean }
export interface Kid { name: string; photo?: string; note: string }
export type MedPlan = 'none' | 'champix' | 'nrt'
export interface Settings {
  setupDone: boolean; lang: Lang; theme: Theme
  cigsPerDay: number; packPrice: number; packSize: number
  quitAt: number                                   // epoch ms
  reward: { name: string; cost: number }
  kidsReward: { name: string; cost: number }
  kids: Kid[]; myLine: string
  faithOn: boolean; intention: string; faithTexts: FaithText[]
  replacements: Partial<Record<TriggerTag, Replacement>>
  med: { plan: MedPlan; products: string[]; startAt: number; schedule: Record<string, string[]>; prices: Record<string, number> }
  commute: string[]                                // 'HH:MM'
  sound: boolean; haptics: boolean
}
export interface Check { at: number; breathing: number; cough: number; sleep: number; energy: number; focus: number }
export interface Game {
  bonus: number; stickers: string[]; level: number
  /** high-water marks: what the user has reached never shrinks, even if the quit date moves (see game.ts shown*) */
  peak: number; bestStage: number; bestFruit: number
  /** paid = mission ids already credited into bonus today (see game.ts settleMissions) */
  missions: { date: string; ticked: string[]; chest: boolean; paid?: string[] }
}
export interface AppData { version: 1; settings: Settings; events: AppEvent[]; badges: string[]; checks: Check[]; game: Game }
export type NotifyStatus = 'ok' | 'denied' | 'unsupported'
