import { ElectronAPI } from '@/shared/types'

declare global {
  interface Window {
    electron: ElectronAPI
    electronAPI: ElectronAPI  // Alias for backward compatibility
  }
}

export {}