# Not Today: quit-smoking companion (design)

Date: 2026-11-11.

## Purpose

Most people who quit smoking on willpower alone need several attempts. The hard
parts are the craving itself, focus, stress and headaches, and smoking is
woven into the day. This app is a companion for the next attempt. It covers
the habit and motivation side; the medicine (Champix, or patch plus gum, from a
doctor or pharmacist) covers the nicotine side. The app never gives doses.

Success: the user opens it during a craving instead of lighting a cigarette,
and it still motivates them after a slip.

## Principles

1. **Not today.** The app never says "forever". It asks for today, and for the
   next 5 minutes.
2. **Progress cannot be lost.** A slip is logged; nothing resets to zero.
3. **The user's own words.** Reasons, people and faith texts are theirs; the app shows
   them back at the right moment.
4. **Simple language**, English first, Arabic (right-to-left) as a switch.

## Screens

### Home
- Today card: "Day N. Not today." and total smoke-free days.
- Craving button, large, always visible.
- Five motivation tiles (below).
- Latest achievement and the next one to unlock.
- Bottom navigation: Home, Triggers, Achievements, Medicine, Settings.

### Craving (the core)
- 5-minute countdown with a breathing circle (4 s in, 6 s out).
- Shows the replacement chosen for the current trigger, if known.
- Cycles through the five motivations: the photo of the people they do it for, money saved, a faith
  text (if enabled), next health milestone, their own line. A motivation with nothing to show (for example no people added yet) is skipped.
- Ends with "Craving beaten: N so far" and logs the win. A "I smoked" button
  logs a slip instead, with the message "One slip is not the end. Carry on."
  and, if faith is enabled, the verse on mercy (39:53).
- **Drive mode** (toggle on the screen, auto-suggested at their commute times):
  very large text, no reading required, breathing cued by rising and falling
  tones (Web Audio) and vibration. No speech synthesis: it is unreliable in the
  Android WebView.
- **Work break:** the same timer started from a "Break without a cigarette"
  shortcut, logged as a win.

### Motivation tiles and pages

| Tile | Home shows | Page |
|---|---|---|
| Money | EGP saved | Per-month figure, progress bar to the user's chosen reward |
| Health | Overall recovery % and next milestone | Health progress page (below) |
| The people you do it for (family, kids, partner, parents) | Their names and photos; with none added, an invitation to add them | A note to each of them; "N smoke-free days for them"; a reward the user can set for them from the money saved |
| Myself | Cravings beaten | Log of wins and slips; the user's editable line (default: "I am stronger than a five-minute craving.") |
| Faith | One text, rotating daily | The user's intention (niyyah) and an editable list of verses and duas |

The tile is named from the names entered in setup and starts empty, inviting the user to add the people they do it for. The tone is
always "for them", never guilt: no messages about harming them.

### Health progress
- One progress bar per milestone, filling from 0 to 100% as time passes, with
  the reached ones ticked. The home tile shows the overall percentage.
- **Weekly self-check:** once a week the user rates breathing, cough, sleep, energy
  and focus from 1 to 5. A small chart shows their own numbers improving, which
  is more convincing than a generic timeline. The focus and headache dip in
  week 1 is labelled "withdrawal, expected, passes".

### Achievements
Badges, each unlocked once and kept forever (a slip never removes one). A new
badge shows a full-screen moment with the photos of the people they do it for and a faith text.

| Group | Badges |
|---|---|
| Time | First 24 hours, 3 days (the hardest part), 1 week, 2 weeks, 1 month, 3 months, 6 months, 1 year |
| Cravings | 1, 10, 50, 100, 250 cravings beaten |
| Money | 500, 1,000, 5,000, 10,000 EGP saved; reward reached |
| Triggers | First drive without smoking, first coffee without one, first stressful work day without one |
| Comeback | Carried on the day after a slip |
| Health | Each health milestone reached; 4 weekly self-checks done |
| Medicine | 7 days of medicine taken on time; full course finished |

The Achievements page shows earned badges in colour, the rest greyed with what
unlocks them, and the next one closest to unlocking at the top.

### Triggers
- Before the quit date: one tap logs a cigarette with a tag (after food, coffee
  or tea, car, stress, work break, with smokers, other).
- Shows the user's top trigger moments by count and hour of day.
- The user picks a replacement per trigger (gum, cold water, walk, wudu, call, other).
- After the quit date: a notification a few minutes before their usual trigger
  hours, naming the replacement.

### Medicine
- The user picks the plan their doctor or pharmacist gave them: Champix, patch plus gum,
  or none, and sets their own reminder times. The app shows "Day N of your
  course" and sends the reminders. No dose advice.
- For the first 4 weeks after the quit date: a daily "halve your coffee and
  tea" reminder.
- Hotlines 105 and 15335 (Egypt), one tap to call.
- **Helpers in Egyptian pharmacies:** a reference list the user can pick a plan
  from. Each entry has what it is, when it helps, whether it needs a
  prescription, and an indicative price they can edit. Shipped entries:

  | Product | Type | Prescription | Note |
  |---|---|---|---|
  | Champix (varenicline) starter pack, then 1 mg 28 tablets | Tablet, no nicotine | Yes | Start about a week before the quit date. Listed around 250 EGP for the starter pack. |
  | Nicorette Invisi patch (stepped strengths) | Patch, steady level all day | No | Base layer against craving and poor focus. |
  | Nicotinell mint 2 mg gum | Gum, fast | No | For sudden urges: after food, coffee, in the car. |
  | Nicotine-stop 4 mg gum | Gum, fast, stronger | No | Same use, for heavier smokers. |
  | Nicorette QuickMist | Mouth spray, fastest | No | Around 725 EGP. Strong sudden cravings. |

  Fixed lines on the page: "Prices and stock change; check at the pharmacy",
  "Ask the pharmacist or doctor for your dose", and "Do not combine Champix
  with patches or gum unless your doctor says so". Prices are those found in
  November 2026 and are not updated automatically.
- When the plan includes gum or spray, the craving screen offers "Take your
  gum/spray now" as the first replacement.

### Setup and Settings
Cigarettes per day, pack price and size, quit date, reward (name and cost),
the people they do it for (none by default; names and optional photos), faith on or off, their own line, commute times,
language, light or dark theme, export and import of all data as one JSON file.

Quit date help: there is rarely a quiet week, so the app does not wait for
one. It suggests a date 7 days out (enough to log triggers and, for
Champix, to start the tablets first).

## Faith starter set (optional, Islamic)

An optional starter set, on by default and switchable off in setup or settings. Shipped as editable defaults; the user can change
or remove any text. Arabic text with a short English meaning.

- "وَلَا تُلْقُوا بِأَيْدِيكُمْ إِلَى التَّهْلُكَةِ" (Al-Baqarah 2:195)
- "وَلَا تَقْتُلُوا أَنفُسَكُمْ ۚ إِنَّ اللَّهَ كَانَ بِكُمْ رَحِيمًا" (An-Nisa 4:29)
- "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا" (Al-Baqarah 2:286)
- "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا" (Ash-Sharh 94:5)
- "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا" (At-Talaq 65:2)
- "إِنَّ اللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّىٰ يُغَيِّرُوا مَا بِأَنفُسِهِمْ" (Ar-Ra'd 13:11)
- "وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا" (Al-Ankabut 29:69)
- "اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ" (Al-Baqarah 2:153)
- After a slip: "لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ" (Az-Zumar 39:53)
- Hadith: "لا ضرر ولا ضرار" (Ibn Majah)
- Hadith: "إنك لن تدع شيئاً لله عز وجل إلا بدّلك الله به ما هو خير لك منه" (Ahmad)
- Dua: "اللهم أعنّي على ذكرك وشكرك وحسن عبادتك" (Abu Dawud)
- Dhikr for the craving screen: "لا حول ولا قوة إلا بالله"

Also:
- "Make wudu" and "pray two rak'ahs" are offered as craving replacements.
- A fixed note on the Faith page: "In Ramadan you go the whole fasting day
  without a cigarette. You have already proved you can."
- The app gives no religious rulings.

## Rules and calculations

All in one pure module, `src/lib/progress.ts`, taking (settings, events, now):

- **Smoke-free days** = calendar days since the quit date that contain no slip.
  Never resets.
- **Cigarettes not smoked** = days since quit × cigarettes per day − slip
  cigarettes, floor 0.
- **Money saved** = cigarettes not smoked × (pack price ÷ pack size), in EGP.
- **Cravings beaten** = count of win events.
- **Health milestones**, measured from the quit date: 20 minutes (heart rate
  and blood pressure drop), 12 hours (carbon monoxide back to normal), 2 weeks
  to 3 months (circulation and lung function improve), 1 to 9 months (coughing
  and shortness of breath ease), 1 year (added heart disease risk about half a
  smoker's). Simplification: slips do not move the timeline; the page says so
  in one line.
- **Overall recovery %** = average of the milestone bars.
- **Achievements** = a pure function listing which badges the current settings
  and events have earned; earned badge ids are also stored so none is ever
  lost. The three "first without smoking" badges come from a craving beaten
  under that trigger tag.
- **Top triggers** = pre-quit smoke events grouped by tag and by hour.

## Architecture

- One web app: Vite, React, TypeScript. No backend, no account.
- `src/lib/`: `progress.ts` (rules above), `store.ts` (load, save, export,
  import), `i18n.ts` (two plain dictionaries, sets `dir`), `notify.ts`
  (schedules reminders).
- `src/screens/`: one file per screen listed above.
- **Storage:** one versioned JSON document in `localStorage`:
  `{ version, settings, events[], badges[], checks[] }`, where an event is
  `{ type: 'smoke' | 'win' | 'slip' | 'dose', at, trigger?, count? }` and a
  check is one weekly self-rating. The photo is
  stored as a downscaled data URL. Import validates the shape and refuses
  anything else, leaving current data untouched.
- **Android:** Capacitor, app id `net.fluxgen.nottoday`, with
  `@capacitor/local-notifications`. Signed APK named `Not-Today-<version>.apk`
  using a release keystore.
- **Desktop:** Electron wrapper around the same build, Windows installer built
  with electron-builder. Reminders on desktop only fire while the app is open; the phone is
  the reminder device.
- **Look:** light with a teal accent, plus dark mode, in a clean "Fresh" style.

## Error handling

- Storage unreadable or wrong version: keep the raw data, show setup with an
  "import a backup" option; never silently wipe.
- Notification permission refused: the app works fully; Medicine and Triggers
  show one line explaining reminders are off.
- Quit date in the future: Home shows a countdown and the trigger logger.

## Testing

- Vitest unit tests for `progress.ts`: the slip rule (no reset), money, floor
  at zero, milestones at their boundaries, trigger grouping, each badge
  group's unlock rule, that a slip removes no badge, and `store.ts`
  import validation.
- Manual check on the phone over adb: craving flow, drive mode tones,
  a scheduled reminder, Arabic layout.

## Not in version 1

Cloud sync between phone and desktop (use export and import), budget-app
integration, home-screen widget, social features, AI chat, prayer-time
calculation, speech guidance.
