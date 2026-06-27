import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Admin {
  id: string
  name: string
  email: string
}

interface AdminAuthState {
  admin: Admin | null
  token: string | null
  login: (admin: Admin, token: string) => void
  logout: () => void
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      admin: null,
      token: null,
      login: (admin, token) => set({ admin, token }),
      logout: () => set({ admin: null, token: null }),
    }),
    { name: 'admin-auth-storage' },
  ),
)
