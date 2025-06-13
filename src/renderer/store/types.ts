import type { SettingsState } from './slices/settingsSlice'
import type { UIState } from './slices/uiSlice'
import type { ConnectionState } from './slices/connectionSlice'
import type { TabsState } from './slices/tabsSlice'

export interface StoreState {
  settings: SettingsState
  ui: UIState
  connection: ConnectionState
  tabs: TabsState
}