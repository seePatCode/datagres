import { vi } from 'vitest'

export const mockClient = {
  connect: vi.fn(),
  query: vi.fn(),
  end: vi.fn()
}

export const Client = vi.fn(() => mockClient)

export default {
  Client,
  mockClient
}