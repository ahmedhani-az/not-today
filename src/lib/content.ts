import type { FaithText, Replacement, TriggerTag } from './types'

export const FAITH_DEFAULTS: FaithText[] = [
  { id: 'f-2-195', kind: 'verse', ref: 'Al-Baqarah 2:195', refAr: 'البقرة ١٩٥', ar: 'وَلَا تُلْقُوا بِأَيْدِيكُمْ إِلَى التَّهْلُكَةِ', en: 'Do not throw yourselves into destruction with your own hands.' },
  { id: 'f-4-29', kind: 'verse', ref: 'An-Nisa 4:29', refAr: 'النساء ٢٩', ar: 'وَلَا تَقْتُلُوا أَنفُسَكُمْ ۚ إِنَّ اللَّهَ كَانَ بِكُمْ رَحِيمًا', en: 'Do not harm yourselves. God is merciful to you.' },
  { id: 'f-2-286', kind: 'verse', ref: 'Al-Baqarah 2:286', refAr: 'البقرة ٢٨٦', ar: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا', en: 'God does not burden a soul beyond what it can bear.' },
  { id: 'f-94-5', kind: 'verse', ref: 'Ash-Sharh 94:5', refAr: 'الشرح ٥', ar: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', en: 'With hardship comes ease.' },
  { id: 'f-65-2', kind: 'verse', ref: 'At-Talaq 65:2', refAr: 'الطلاق ٢', ar: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا', en: 'Whoever fears God, He makes a way out for him.' },
  { id: 'f-13-11', kind: 'verse', ref: "Ar-Ra'd 13:11", refAr: 'الرعد ١١', ar: 'إِنَّ اللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّىٰ يُغَيِّرُوا مَا بِأَنفُسِهِمْ', en: 'God does not change a people until they change what is in themselves.' },
  { id: 'f-29-69', kind: 'verse', ref: 'Al-Ankabut 29:69', refAr: 'العنكبوت ٦٩', ar: 'وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا', en: 'Those who strive for Us, We will guide them to Our ways.' },
  { id: 'f-2-153', kind: 'verse', ref: 'Al-Baqarah 2:153', refAr: 'البقرة ١٥٣', ar: 'اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ', en: 'Seek help through patience and prayer.' },
  { id: 'f-39-53', kind: 'verse', ref: 'Az-Zumar 39:53', refAr: 'الزمر ٥٣', ar: 'لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ', en: "Do not despair of God's mercy.", onSlip: true },
  { id: 'h-ibn-majah', kind: 'hadith', ref: 'Ibn Majah', refAr: 'ابن ماجه', ar: 'لا ضرر ولا ضرار', en: 'No harm and no returning harm.' },
  { id: 'h-ahmad', kind: 'hadith', ref: 'Ahmad', refAr: 'أحمد', ar: 'إنك لن تدع شيئاً لله عز وجل إلا بدّلك الله به ما هو خير لك منه', en: 'You will not give up anything for God without God giving you something better in its place.' },
  { id: 'd-abu-dawud', kind: 'dua', ref: 'Abu Dawud', refAr: 'أبو داود', ar: 'اللهم أعنّي على ذكرك وشكرك وحسن عبادتك', en: 'O God, help me to remember You, thank You and worship You well.' },
  { id: 'z-hawqala', kind: 'dhikr', ref: '', refAr: '', ar: 'لا حول ولا قوة إلا بالله', en: 'There is no power or strength except with God.' },
]

// ms = time from the quit date until the bar is full
export const MILESTONES = [
  { id: 'hr', ms: 20 * 60_000 },
  { id: 'co', ms: 12 * 3_600_000 },
  { id: 'circulation', ms: 90 * 86_400_000 },
  { id: 'lungs', ms: 270 * 86_400_000 },
  { id: 'heart', ms: 365 * 86_400_000 },
]

export const TRIGGER_TAGS: TriggerTag[] = ['food', 'coffee', 'car', 'stress', 'break', 'smokers', 'other']
export const REPLACEMENTS: Replacement[] = ['gum', 'spray', 'water', 'walk', 'wudu', 'pray', 'call', 'breathe']

export const MEDICINES: { id: string; plan: 'champix' | 'nrt'; rx: boolean; priceEgp?: number }[] = [
  { id: 'champix', plan: 'champix', rx: true, priceEgp: 250 },
  { id: 'invisi-patch', plan: 'nrt', rx: false },
  { id: 'nicotinell-2', plan: 'nrt', rx: false },
  { id: 'nicotine-stop-4', plan: 'nrt', rx: false },
  { id: 'quickmist', plan: 'nrt', rx: false, priceEgp: 725 },
]

export const LEVEL_NAMES = ['seed', 'sprout', 'seedling', 'sapling', 'young-tree', 'blossom', 'gardener', 'grove-keeper', 'orchard-keeper', 'forest-guardian']

export const STICKERS: string[] = [
  'tulip', 'robin', 'bee', 'rose', 'daisy', 'sunflower', 'butterfly', 'ladybird', 'watering-can', 'lantern', 'mushroom', 'hedgehog',
  'snail', 'dragonfly', 'lavender', 'poppy', 'jasmine', 'lotus', 'palm', 'hoopoe', 'bluebell', 'frog', 'acorn', 'wheelbarrow',
]

/** Smoke-free days at which the tree reaches stage 0..8. */
export const TREE_STAGES = [0, 1, 3, 7, 14, 30, 90, 180, 365]

/** Usual times pre-filled when a product is ticked; products not listed have no fixed times. */
export const DEFAULT_TIMES: Record<string, string[]> = { champix: ['08:00', '20:00'], 'invisi-patch': ['07:00'] }
export const defaultTimes = (id: string): string[] => [...(DEFAULT_TIMES[id] ?? [])]

/** self = the user ticks it themselves; the rest are worked out from what the app already knows. */
export const MISSIONS: { id: string; self: boolean }[] = [
  { id: 'crave', self: false }, { id: 'meds', self: false }, { id: 'break', self: false },
  { id: 'water', self: true }, { id: 'walk', self: true }, { id: 'check', self: false },
]
