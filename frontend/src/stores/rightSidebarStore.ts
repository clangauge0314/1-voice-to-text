import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const DEFAULT_RIGHT_SIDEBAR_WIDTH = 320
export const MIN_RIGHT_SIDEBAR_WIDTH = 260
export const MAX_RIGHT_SIDEBAR_WIDTH = 520

interface RightSidebarState {
  isOpen: boolean
  width: number
  toggle: () => void
  open: () => void
  close: () => void
  setWidth: (width: number) => void
}

function clampWidth(width: number) {
  return Math.min(MAX_RIGHT_SIDEBAR_WIDTH, Math.max(MIN_RIGHT_SIDEBAR_WIDTH, width))
}

export const useRightSidebarStore = create<RightSidebarState>()(
  persist(
    (set) => ({
      isOpen: true,
      width: DEFAULT_RIGHT_SIDEBAR_WIDTH,
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      setWidth: (width) => set({ width: clampWidth(width) }),
    }),
    { name: 'right-sidebar-storage' },
  ),
)
