import { create } from 'zustand'

interface MemoPlaybackState {
  currentTime: number
  isPlaying: boolean
  setCurrentTime: (time: number) => void
  setIsPlaying: (isPlaying: boolean) => void
  resetPlayback: () => void
}

export const useMemoPlaybackStore = create<MemoPlaybackState>()((set) => ({
  currentTime: 0,
  isPlaying: false,
  setCurrentTime: (time) => set({ currentTime: time }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  resetPlayback: () => set({ currentTime: 0, isPlaying: false }),
}))
