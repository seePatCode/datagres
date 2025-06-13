import type { SettingsState } from './slices/settingsSlice'
import type { UIState } from './slices/uiSlice'
import type { ConnectionState } from './slices/connectionSlice'

export interface StoreState {
  settings: SettingsState
  ui: UIState
  connection: ConnectionState
}