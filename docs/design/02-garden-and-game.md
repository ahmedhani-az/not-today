# Not Today 0.2: garden, game and medicine times (design)

Date: 2026-11-11. Builds on `01-core.md`; everything there still
holds, including: no dose amounts, no guilt about the people the user does it for, simple language,
English and Arabic, teal light and dark themes.

## Purpose

Make beating a craving the most rewarding thing in the app, so opening it
feels better than lighting a cigarette. Add per-medicine times so the user can see
and tick today's doses from Home.

## The one rule

Nothing is ever taken away. No lives, no broken streaks, no wilting plants,
no points lost. A slip only means nothing new is added.

## 1. Game during the craving

- The running craving screen gets a two-way switch: **Breathe** (as now) and
  **Play**.
- Play is "Clear the smoke": grey smoke clouds drift over a picture (the photo of
  one of the people they do it for if set, otherwise their garden). Tapping a cloud pops it with a puff and a
  light vibration; new clouds keep drifting in, slower as the timer runs down,
  so at 0:00 the picture is clear.
- The countdown stays visible. The suggestion card and "I smoked" stay.
- Pops earn bonus points: 1 point per 10 pops, at most 20 per craving.
- Drive mode never shows Play.

## 2. Surprise reward after every win

- At 0:00: confetti, a chime, a vibration, then a face-down card the user taps to
  flip.
- The card is one of, chosen at random with these weights:
  - kids (25): the note and photo of one of the people they do it for, when a note or photo exists
  - faith (25): one non-slip faith text, when faith is on
  - points (25): bonus 10, 20, 30 or 50 points
  - health (15): their next health milestone and how close they are
  - sticker (10): a collectible not yet owned (falls back to points when the user
    owns all)
- Unavailable kinds are left out and the rest keep their relative weights.
- Stickers: a set of 24 small garden illustrations (flowers, birds,
  butterflies, a watering can, a bee, a lantern and so on) shown in a sticker
  book on the Garden page; missing ones are silhouettes.

## 3. Points and levels

- Points are computed, not stored, so they cannot be lost:
  `50 x cravings beaten + 20 x doses taken + 40 x self-checks + 100 x
  smoke-free days + bonus`. Only `bonus` (cards, chests, game pops) is stored.
- Level `n` starts at `100 x n x (n - 1)` points (level 1 at 0, level 2 at
  200, level 3 at 600, level 4 at 1,200 ...).
- Level names 1 to 10: Seed, Sprout, Seedling, Sapling, Young Tree, Blossom,
  Gardener, Grove Keeper, Orchard Keeper, Forest Guardian. Above 10 the name
  stays Forest Guardian with the number.
- Home shows the level, a progress bar to the next level, and a level-up
  moment (full screen, like a badge) when it rises.

## 4. The garden

- A living illustration at the top of Home (tapping it opens the Garden page):
  - **Tree:** 9 growth stages at 0, 1, 3, 7, 14, 30, 90, 180 and 365
    smoke-free days.
  - **Flowers:** one per craving beaten, placed on the ground in a stable
    pseudo-random layout; at most 40 drawn, the count shown beyond that.
  - **Fruit:** one on the tree per full smoke-free week, at most 12 drawn.
  - **Visitors:** a butterfly from level 3, a bird from level 5, bees from
    level 7.
  - **Sky:** follows the phone's time of day: dawn, day, dusk, night with
    stars.
- Gentle motion: the tree sways, visitors move, new flowers pop in.
- Garden page: the large garden, "what grows next" (next tree stage and how
  many days away), the sticker book, and totals.
- Inline SVG and CSS only.

## 5. Daily missions

- Three per day, chosen by the date from this pool, skipping ones that do not
  apply: beat a craving (auto), take every medicine on time today (auto, only
  with a plan), a break without a cigarette (auto), water instead of the second
  coffee (the user ticks), a 5-minute walk (the user ticks), weekly self-check (auto, only
  when one is due).
- Each mission gives 20 points when done. All three open a chest: 50 bonus
  points and a 1-in-3 chance of a sticker. One chest per day.
- Yesterday's unfinished missions simply disappear.

## 6. Polish

- Numbers count up when they change (money, days, points).
- Confetti, chime and vibration on wins, badges, level-ups and chests.
- Short screen transitions; buttons scale slightly on press with a light
  vibration.
- Settings gets two switches: Sound and Vibration (both on by default).
- All motion stops under the system "reduce motion" setting; the reward card
  still appears, without animation.

## 7. Medicine times

- Each ticked product has its own list of times instead of one shared list.
- Ticking a product pre-fills usual times, which the user can change:
  - Champix: 08:00 and 20:00. Note: "Usually morning and evening, after food,
    with a full glass of water. Your first week is different: follow the
    starter pack."
  - Nicorette Invisi patch: 07:00. Note: "Put it on when you wake up and take
    it off at bedtime."
  - Gums and spray: no fixed times. Note: "Use it when a craving comes."
- A fixed line stays: "Follow your leaflet and your doctor or pharmacist."
  No amounts (mg, number of tablets or pieces) appear anywhere.
- Home shows a **Medicine today** card when a plan is set: each dose with its
  time, a tick button, and the next one highlighted with the time left. A dose
  counts as on time when ticked within 2 hours either side.
- Reminders name the product. Existing saved times move to the first ticked
  product.

## Data

Top-level additions to the stored document (missing fields are filled with
defaults on load and import; version stays 1):

```ts
game: { bonus: number; stickers: string[]; missions: { date: string; ticked: string[]; chest: boolean }; level: number }
```

`settings.med.schedule: Record<string, string[]>` replaces `med.times`;
`settings.sound` and `settings.haptics` are booleans; a `dose` event gains
`product?: string` and `slot?: string` ('HH:MM').

## Testing

Unit tests for points, levels, tree stage, flower and fruit counts, the reward
picker with an injected random source (weights, unavailable kinds, sticker
fallback), mission choice being stable for a date, chest once per day, dose
on-time window, migration of old `med.times`, and that a slip lowers nothing.
Browser check at phone size of Home, Garden, the game, the reward card,
missions and the medicine card, in light, dark and Arabic.

## Not in this version

Leaderboards, sharing, sounds beyond simple generated tones, more games.
