# Not Today Implementation Plan

**Goal:** Build the Not Today quit-smoking companion as one offline web app, shipped as a signed Android APK and a Windows installer.

**Architecture:** A Vite + React + TypeScript single-page app at the repo root. All rules live in pure modules under `src/lib/` and are unit tested; screens under `src/screens/` only render and dispatch. `mobile/` (Capacitor) and `desktop/` (Electron) wrap the built `dist/`, using the standard Capacitor and electron-builder setups.

**Tech Stack:** Vite, React 18, TypeScript, Vitest, plain CSS (variables, no UI library, no router library), Capacitor 8 + `@capacitor/local-notifications`, Electron + electron-builder.

**Spec:** `docs/design/01-core.md` (read it first; this plan does not repeat its copy, badge list, medicine table or faith texts).

## Global Constraints

- App name "Not Today", app id `net.fluxgen.nottoday`, version `0.1.0`.
- No backend, no account, no analytics, no network calls at runtime. No web fonts from a CDN.
- English first; Arabic switch sets `<html dir="rtl" lang="ar">`. Every user-visible string goes through `t()`.
- Simple language. No dose advice anywhere. No guilt messages about the people the user does it for.
- A slip never resets a counter and never removes a badge.
- Light theme with teal accent `#14B8A6`, plus dark theme; both via CSS variables on `:root[data-theme]`.
- Money is EGP, shown with `Intl.NumberFormat`.
- Dependencies: only those named in Tech Stack. Charts and icons are inline SVG.
- Commit after each task; conventional commit messages.

## Review Focus

1. Quit date in the future: every number is 0 (never negative) and Home shows a countdown.
2. Setup numbers blank or 0 (pack size 0, price 0): no `NaN`/`Infinity` on screen.
3. Corrupt `localStorage` or a wrong import file: current data untouched, clear message, never a blank screen.
4. Large photo of a person the user does it for: downscaled before save; a quota error on save shows a message and keeps the old data.
5. More slip cigarettes than cigarettes avoided: floors at 0.

## File Structure

```
index.html, vite.config.ts, package.json, tsconfig.json
src/main.tsx            mounts <App/>
src/App.tsx             loads data, holds state, switches screens, bottom nav
src/styles.css          tokens, layout, components
src/lib/types.ts        all shared types
src/lib/store.ts        load / save / export / import / defaults
src/lib/progress.ts     calculations
src/lib/achievements.ts badges
src/lib/content.ts      milestones, medicines, faith defaults, trigger tags, replacements
src/lib/i18n.ts         en/ar dictionaries, t(), applyLang()
src/lib/notify.ts       reminder scheduling
src/lib/sound.ts        breathing tones + vibration
src/screens/*.tsx       Setup, Home, Craving, Tile pages, Triggers, Achievements, Medicine, Health, Settings
mobile/                 Capacitor wrapper
desktop/                Electron wrapper
```

---

### Task 1: Scaffold, types, store

**Files:** create `package.json`, `vite.config.ts` (with `base: './'` and vitest `environment: 'jsdom'`), `tsconfig.json`, `index.html`, `.gitignore` (node_modules, dist, release, `keystore.properties`, `*.jks`, `*.keystore`, `mobile/www`), `src/lib/types.ts`, `src/lib/store.ts`, `src/lib/store.test.ts`.

**Produces** (`types.ts`, exact):

```ts
export type Lang = 'en' | 'ar'
export type Theme = 'light' | 'dark'
export type TriggerTag = 'food' | 'coffee' | 'car' | 'stress' | 'break' | 'smokers' | 'other'
export type Replacement = 'gum' | 'spray' | 'water' | 'walk' | 'wudu' | 'pray' | 'call' | 'breathe'
export type EventType = 'smoke' | 'win' | 'slip' | 'dose'
export interface AppEvent { type: EventType; at: number; trigger?: TriggerTag; count?: number }
export interface FaithText { id: string; ar: string; en: string; ref: string; kind: 'verse' | 'hadith' | 'dua' | 'dhikr'; onSlip?: boolean }
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
  med: { plan: MedPlan; products: string[]; startAt: number; times: string[]; prices: Record<string, number> }
  commute: string[]                                // 'HH:MM'
}
export interface Check { at: number; breathing: number; cough: number; sleep: number; energy: number; focus: number }
export interface AppData { version: 1; settings: Settings; events: AppEvent[]; badges: string[]; checks: Check[] }
```

**Produces** (`store.ts`):

```ts
export const STORAGE_KEY = 'not-today'
export function defaultData(now: number): AppData   // no kids by default, packSize 20, quitAt = now + 7 days, faithOn true, faithTexts from content.ts, lang 'en', theme 'light', setupDone false
export function loadData(now: number): { data: AppData; corrupt: boolean }  // corrupt=true keeps the raw string under STORAGE_KEY + '-corrupt' and returns defaults
export function saveData(data: AppData): boolean     // false on quota/storage error, never throws
export function parseImport(text: string): AppData | null   // null unless valid JSON with version 1, settings object, events/badges/checks arrays
export function exportJson(data: AppData): string
```

- [ ] Write `store.test.ts`: `defaultData` has no kids and `setupDone === false`; save then load round-trips; `loadData` with `localStorage[STORAGE_KEY] = '{bad'` returns `corrupt: true`, defaults, and preserves the raw string under `not-today-corrupt`; `parseImport('[]')`, `parseImport('{"version":2}')`, `parseImport('nope')` are `null`; `parseImport(exportJson(d))` deep-equals `d`; `saveData` returns `false` when `localStorage.setItem` throws.
- [ ] Run `npx vitest run`, see failures; implement; see pass.
- [ ] `content.ts` is needed for faith defaults: create it in this task with the faith list only (texts copied exactly from the spec, each with a short English meaning; 39:53 has `onSlip: true`); Task 3 adds the rest.
- [ ] Commit.

### Task 2: progress.ts

**Files:** `src/lib/progress.ts`, `src/lib/progress.test.ts`. **Consumes:** types.

```ts
export const DAY = 86_400_000
export function elapsed(d: AppData, now: number): number          // max(0, now - quitAt)
export function smokeFreeDays(d: AppData, now: number): number    // floor(elapsed/DAY) minus the number of distinct 24h periods (counted from quitAt) that contain a post-quit slip; floor 0
export function cigsAvoided(d: AppData, now: number): number      // floor(elapsed/DAY * cigsPerDay) - sum(slip.count ?? 1), floor 0
export function moneySaved(d: AppData, now: number): number       // cigsAvoided * packPrice / packSize; 0 when packSize <= 0
export function monthlySaving(s: Settings): number                // cigsPerDay * 30 * packPrice / packSize; 0 when packSize <= 0
export function cravingsBeaten(d: AppData): number                // count of 'win'
export function milestones(d: AppData, now: number): { id: string; pct: number; reached: boolean }[]  // pct = clamp(elapsed / MILESTONES[i].ms, 0, 1) * 100
export function overallRecovery(d: AppData, now: number): number  // rounded mean of pct
export function nextMilestone(d: AppData, now: number): { id: string; msLeft: number } | null
export function topTriggers(events: AppEvent[]): { tag: TriggerTag; count: number; hour: number }[]  // 'smoke' events grouped by tag, desc; hour = most common local hour for that tag
export function courseDay(s: Settings, now: number): number       // floor((now - med.startAt)/DAY) + 1, min 0 before start
export function suggestQuitDate(now: number): number              // now + 7 * DAY
```

`MILESTONES` lives in `content.ts` (Task 3 owns the file, but add this export now): ids `hr` 20 min, `co` 12 h, `circulation` 90 days, `lungs` 270 days, `heart` 365 days.

- [ ] Tests (fixture: 20 cigs/day, pack 20 for 100 EGP, `quitAt = T`): at `T + 10*DAY` no slips → days 10, avoided 200, money 1000; add slips at day 2 (count 3) and day 2 again (count 1) → days 9, avoided 196; a slip does not reduce `cravingsBeaten`; `now < quitAt` → every function 0 and `milestones` all pct 0; 500 slip cigarettes → avoided 0, money 0; `packSize: 0` → money 0 and monthly 0 (not NaN); at `T + 12h` → `hr` reached 100, `co` reached 100, `heart` pct ≈ 0.14, `nextMilestone` id `circulation`; `topTriggers` orders by count and reports the modal hour; `courseDay` is 1 on the start day.
- [ ] Fail, implement, pass, commit.

### Task 3: content, i18n, achievements

**Files:** `src/lib/content.ts`, `src/lib/i18n.ts`, `src/lib/achievements.ts`, `src/lib/achievements.test.ts`, `src/lib/i18n.test.ts`.

```ts
// content.ts
export const TRIGGER_TAGS: TriggerTag[]; export const REPLACEMENTS: Replacement[]
export const MEDICINES: { id: string; plan: 'champix' | 'nrt'; rx: boolean; priceEgp?: number }[]  // ids: champix, invisi-patch, nicotinell-2, nicotine-stop-4, quickmist; champix 250, quickmist 725; names/notes come from i18n keys `med.<id>.name|type|note`
// i18n.ts
export function t(key: string, vars?: Record<string, string | number>): string   // current language, falls back to en, then to the key
export function setLang(lang: Lang): void    // also sets document.documentElement lang and dir
export const dict: Record<Lang, Record<string, string>>
// achievements.ts
export const BADGES: { id: string; group: 'time' | 'cravings' | 'money' | 'triggers' | 'comeback' | 'health' | 'medicine' }[]
export function earnedBadges(d: AppData, now: number): string[]
export function syncBadges(d: AppData, now: number): { data: AppData; fresh: string[] }  // union of stored and earned; fresh = newly added ids
export function nextBadge(d: AppData, now: number): string | null   // first unearned in BADGES order within the 'time' group, else first unearned overall
```

Badge ids and rules (thresholds from the spec table): `time-1d,3d,7d,14d,30d,90d,180d,365d` on `smokeFreeDays`; `crave-1,10,50,100,250` on wins; `money-500,1000,5000,10000` on `moneySaved`; `money-reward` when `reward.cost > 0 && moneySaved >= reward.cost`; `first-car`, `first-coffee`, `first-stress` = a post-quit win with that trigger; `comeback` = a post-quit slip with no other slip in the following 24 h and `now` at least 24 h after it; `health-<milestone id>` when reached; `health-checks-4` at 4 checks; `med-7` = dose events on 7 distinct local days; `med-course` = plan not `none` and `courseDay > 84`.

- [ ] Tests: each group unlocks at its threshold and not one below; `syncBadges` keeps `time-7d` after later slips drop `smokeFreeDays` below 7; `fresh` lists only new ids; `comeback` not earned 23 h after a slip, earned at 24 h; i18n: every key in `dict.en` exists in `dict.ar`; `t('missing.key')` returns the key; `setLang('ar')` sets `dir="rtl"`.
- [ ] Write all UI copy keys as you go in Tasks 4–6; this task ships the keys for badges (`badge.<id>.name`, `badge.<id>.how`), milestones (`ms.<id>.title|body`), medicines, triggers, replacements, and the fixed medicine lines and Ramadan note from the spec. Arabic must be natural Egyptian-friendly Modern Standard Arabic.
- [ ] Fail, implement, pass, commit.

### Task 4: App shell, Setup, Home, tile pages

**Files:** `src/main.tsx`, `src/App.tsx`, `src/styles.css`, `src/screens/Setup.tsx`, `Home.tsx`, `Money.tsx`, `Health.tsx`, `Kids.tsx`, `Myself.tsx`, `Faith.tsx`, `src/lib/photo.ts`.

**Interfaces:** every screen receives `{ data: AppData; update: (fn: (d: AppData) => AppData) => void; go: (screen: Screen) => void; now: number }`. `App` owns `data`, runs `syncBadges` inside `update`, calls `saveData` (shows a banner when it returns false), ticks `now` every 30 s, and shows a full-screen badge moment for each id in `fresh` (photos of the people they do it for plus a non-`onSlip` faith text when `faithOn`). `Screen` is a string union of all screen names. `photo.ts`: `downscale(file: File, max = 512): Promise<string>` returns a JPEG data URL at quality 0.8.

- [ ] Setup: a short stepper covering every field in the spec's "Setup and Settings" list; number inputs reject negatives; quit date defaults to `suggestQuitDate`. Finishing sets `setupDone`.
- [ ] Home per spec: today card (countdown when quit date is ahead), craving button, "break without a cigarette" shortcut, five tiles, latest and next badge, bottom nav (Home, Triggers, Achievements, Medicine, Settings). Before the quit date the craving button's place also offers the one-tap cigarette logger.
- [ ] Tile pages per the spec tables. Health page: milestone bars, weekly self-check form (five 1–5 ratings, allowed once per 7 days), inline SVG line chart of checks, the week-1 withdrawal label, the "slips do not move the timeline" line.
- [ ] Corrupt-load state: banner with an import button (Review Focus 3).
- [ ] Verify: `npx tsc --noEmit && npx vitest run && npx vite build` all clean. Commit.

### Task 5: Craving screen

**Files:** `src/screens/Craving.tsx`, `src/lib/sound.ts`.

`sound.ts`: `startBreathing(): () => void` plays a rising sine tone for 4 s (inhale) and a falling one for 6 s (exhale) in a loop via Web Audio and calls `navigator.vibrate?.(60)` at each change; the returned function stops it.

- [ ] 5-minute countdown (300 s, driven by timestamps so backgrounding does not stall it), breathing circle animated in CSS at 4 s / 6 s, optional trigger picker at the start, first suggestion = gum or spray when the med plan's products include one, else the replacement set for that trigger.
- [ ] Motivation card rotates every 15 s through kids, money, faith (skipped when `faithOn` is false), next milestone, `myLine`.
- [ ] Finish → append `{type:'win', at, trigger}` and show "Craving beaten: N so far". "I smoked" → count picker, append `{type:'slip', at, count, trigger}`, show the carry-on message and the `onSlip` faith text when `faithOn`.
- [ ] Drive mode toggle: one huge countdown number and the circle only, tones on; auto-on when the current time is within 45 min after any `commute` time. Screen wake lock via `navigator.wakeLock?.request('screen')` while the timer runs.
- [ ] Work-break entry uses the same screen with trigger preset to `break`.
- [ ] Verify as Task 4. Commit.

### Task 6: Triggers, Achievements, Medicine, Settings, notify

**Files:** `src/screens/Triggers.tsx`, `Achievements.tsx`, `Medicine.tsx`, `Settings.tsx`, `src/lib/notify.ts`, `src/lib/notify.test.ts`.

```ts
// notify.ts
export interface Reminder { id: number; title: string; body: string; hour: number; minute: number; weekday?: number; until?: number }
export function buildReminders(d: AppData, now: number): Reminder[]   // pure
export async function scheduleAll(d: AppData, now: number): Promise<'ok' | 'denied' | 'unsupported'>
```

`buildReminders`: one per `med.times` entry (when plan is not `none`); "halve your coffee and tea" daily at 09:00 with `until = quitAt + 28 days` (omitted once past); after the quit date, one per top-3 trigger 5 minutes before its hour, naming the chosen replacement; one per `commute` time; weekly self-check on Friday 20:00. `scheduleAll` uses `@capacitor/local-notifications` when `Capacitor.isNativePlatform()` (cancel all pending, then schedule repeating), otherwise a once-a-minute in-page check that fires the web `Notification` API. `App` calls it after setup and after any settings change.

- [ ] `notify.test.ts`: plan `none` yields no medicine reminders; two med times yield two; the coffee reminder is absent 29 days after quit; trigger reminders are absent before the quit date and at most 3 after; a trigger at hour 9 yields 8:55.
- [ ] Triggers screen: tag logger (pre-quit), top triggers list with hour, replacement picker per tag.
- [ ] Achievements screen: closest-to-unlock first, earned in colour, the rest grey with `badge.<id>.how`.
- [ ] Medicine screen: plan picker, product checklist from `MEDICINES` with editable price, reminder times, "Day N of your course", "Taken" button appending a `dose` event, the three fixed lines, `tel:105` and `tel:15335` links, a line when `scheduleAll` returned `denied`.
- [ ] Settings: all setup fields editable, language, theme, export (download a `.json` file; on native use the same blob download and fall back to showing the JSON in a textarea to copy), import via file input through `parseImport` with a confirm step.
- [ ] Verify as Task 4. Commit.

### Task 7: Android wrapper

**Files:** `mobile/` a standard Capacitor Android wrapper.

- [ ] `mobile/package.json` with the same Capacitor versions as the root plus `@capacitor/local-notifications` (matching major), `capacitor.config.json` (`appId` `net.fluxgen.nottoday`, `appName` `Not Today`, `webDir` `www`), copy script, `npx cap add android`.
- [ ] `android/app/build.gradle`: a keystore-loading block that reads the gitignored `keystore.properties`, `versionCode 1`, `versionName "0.1.0"`, output name `Not-Today-<versionName>.apk` (`-debug` suffix otherwise). Signing values live in the gitignored `mobile/keystore.properties`. Add `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM` is not needed (inexact repeating is fine), `VIBRATE`, `WAKE_LOCK` to the manifest.
- [ ] `npm run build` in `mobile/`; verify with `apksigner verify --print-certs`. Commit (not the APK).

### Task 8: Desktop wrapper

**Files:** `desktop/` a standard Electron wrapper.

- [ ] Minimal `main.js`: one `BrowserWindow` (420×860, resizable) loading `dist/index.html` from `process.resourcesPath` when packaged, else `../dist`; no preload, `contextIsolation` on, external links open in the browser.
- [ ] `package.json` with the same electron-builder approach (a no-wine build script if the installer is built on Linux), `appId` `net.fluxgen.nottoday`, artifact `Not-Today-${version}-Setup.${ext}`, NSIS target only.
- [ ] `npm run dist:win`; confirm the `.exe` exists in `desktop/release`. Commit (not the release folder).

### Task 9: Whole-app check

- [ ] Playwright script (scratchpad, not committed): complete setup, beat one craving with the clock mocked forward, log a slip, confirm days did not reset and a badge moment appeared, switch to Arabic and confirm `dir="rtl"`, import a bad file and confirm the data is unchanged. Screenshots of Home (light, dark, Arabic), Craving, drive mode, Achievements, Health, Medicine at 390×844.
- [ ] Fresh reviewer over the whole branch against the spec and Review Focus.
