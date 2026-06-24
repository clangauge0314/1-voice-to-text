import { create } from 'zustand'

export const EMPTY_SELECTED_INDICES: number[] = []

function areIndicesEqual(a: number[], b: number[]) {
  if (a.length !== b.length) return false
  return a.every((value, index) => value === b[index])
}

interface WordSelectionState {
  memoId: string | null
  selectedIndices: number[]
  setSelection: (memoId: string, selectedIndices: number[]) => void
  clearSelection: () => void
}

export const useWordSelectionStore = create<WordSelectionState>()((set) => ({
  memoId: null,
  selectedIndices: EMPTY_SELECTED_INDICES,
  setSelection: (memoId, selectedIndices) =>
    set((state) => {
      const sorted = [...selectedIndices].sort((a, b) => a - b)
      if (state.memoId === memoId && areIndicesEqual(state.selectedIndices, sorted)) {
        return state
      }
      return { memoId, selectedIndices: sorted }
    }),
  clearSelection: () =>
    set((state) => {
      if (state.memoId === null && state.selectedIndices.length === 0) return state
      return { memoId: null, selectedIndices: EMPTY_SELECTED_INDICES }
    }),
}))
