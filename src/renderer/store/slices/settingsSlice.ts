import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'

// This will replace ThemeProvider and SqlSettingsContext
interface SettingsState {
  theme: 'dark' | 'light' | 'system'
  sqlLivePreview: boolean
}

const initialState: SettingsState = {
  theme: 'dark',
  sqlLivePreview: true,
}

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<SettingsState['theme']>) => {
      state.theme = action.payload
    },
    setSqlLivePreview: (state, action: PayloadAction<boolean>) => {
      state.sqlLivePreview = action.payload
    },
  },
})

export const { setTheme, setSqlLivePreview } = settingsSlice.actions

// Selectors
export const selectTheme = (state: RootState) => state.settings.theme
export const selectSqlLivePreview = (state: RootState) => state.settings.sqlLivePreview

export default settingsSlice.reducer