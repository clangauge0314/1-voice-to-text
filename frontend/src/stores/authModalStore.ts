import { create } from 'zustand'

export type AuthModalMode = 'login' | 'signup'

interface AuthModalState {
  mode: AuthModalMode | null
  openLogin: () => void
  openSignup: () => void
  close: () => void
  setMode: (mode: AuthModalMode) => void
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  mode: null,
  openLogin: () => set({ mode: 'login' }),
  openSignup: () => set({ mode: 'signup' }),
  close: () => set({ mode: null }),
  setMode: (mode) => set({ mode }),
}))
