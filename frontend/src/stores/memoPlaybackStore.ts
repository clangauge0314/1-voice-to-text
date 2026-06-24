import { create } from 'zustand'

interface MemoPlaybackState {
  currentTime: number
  isPlaying: boolean
  pauseSignal: number
  setCurrentTime: (time: number) => void
  setIsPlaying: (isPlaying: boolean) => void
  requestPause: () => void
  resetPlayback: () => void
}

export const useMemoPlaybackStore = create<MemoPlaybackState>()((set) => ({
  currentTime: 0,
  isPlaying: false,
  pauseSignal: 0,
  setCurrentTime: (time) => set({ currentTime: time }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  requestPause: () => set((state) => ({ pauseSignal: state.pauseSignal + 1 })),
  resetPlayback: () => set({ currentTime: 0, isPlaying: false }),
}))
