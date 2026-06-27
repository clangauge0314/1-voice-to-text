import type { MemoSegment, MemoWord } from '../../stores/memoStore'

export interface ContextMenuState {
  x: number
  y: number
  wordIndex: number
}

export interface TranscriptSnapshot {
  words: MemoWord[]
  segments: MemoSegment[]
}
