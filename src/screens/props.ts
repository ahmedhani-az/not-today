import type { AppData, NotifyStatus } from '../lib/types'

export type Screen =
  | 'setup' | 'home' | 'craving' | 'break' | 'slip' | 'money' | 'health' | 'kids' | 'myself' | 'faith'
  | 'garden' | 'triggers' | 'achievements' | 'medicine' | 'settings'

export interface ScreenProps {
  data: AppData
  update: (fn: (d: AppData) => AppData) => void
  award: (badgeId: string) => void
  go: (screen: Screen) => void
  now: number
  notify: NotifyStatus | null
}
