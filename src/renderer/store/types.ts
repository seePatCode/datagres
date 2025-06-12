import type { SettingsState } from './slices/settingsSlice'
import type { UIState } from './slices/uiSlice'

export interface StoreState {
  settings: SettingsState
  ui: UIState
}