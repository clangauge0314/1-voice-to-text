import { create } from 'zustand'
import {
  deleteMemo as deleteMemoApi,
  fetchMemos,
  renameMemo as renameMemoApi,
  saveMemoWords as saveMemoWordsApi,
  type MemoResponse,
} from '../lib/api'

export interface MemoSegment {
  start?: number
  end?: number
  text?: string
  speaker?: string
}

export interface MemoWord {
  id: number
  word: string
  start?: number
  end?: number
  speaker?: string
}

export interface Memo {
  id: string
  title: string
  preview: string
  content: string
  transcriptId: string
  uploadId: string
  audioUrl?: string
  duration?: number
  language?: string
  speakers?: string[]
  segmentCount?: number
  wordCount?: number
  segments?: MemoSegment[]
  words?: MemoWord[]
  updatedAt: string
}

export type MemoInput = Omit<Memo, 'id' | 'updatedAt' | 'content'> & {
  content?: string
}

interface MemoState {
  memos: Memo[]
  selectedMemoId: string | null
  loading: boolean
  setMemos: (memos: Memo[]) => void
  upsertMemo: (memo: Memo) => void
  updateMemo: (id: string, patch: Partial<Memo>) => void
  removeMemo: (id: string) => void
  selectMemo: (id: string) => void
  clearSelection: () => void
  loadMemos: () => Promise<void>
  renameMemo: (id: string, title: string) => Promise<void>
  saveMemoWords: (id: string, words: MemoWord[]) => Promise<void>
  deleteMemo: (id: string) => Promise<void>
}

function formatUpdatedAt(value: string) {
  return new Date(value).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function mapMemoResponse(memo: MemoResponse): Memo {
  return {
    id: memo.id,
    title: memo.title,
    preview: memo.preview,
    content: '',
    transcriptId: memo.transcriptId,
    uploadId: memo.uploadId,
    audioUrl: memo.audioUrl,
    duration: memo.duration ?? undefined,
    language: memo.language ?? undefined,
    speakers: memo.speakers,
    segmentCount: memo.segmentCount ?? undefined,
    wordCount: memo.wordCount ?? undefined,
    updatedAt: formatUpdatedAt(memo.updatedAt),
  }
}

export const useMemoStore = create<MemoState>()((set, get) => ({
  memos: [],
  selectedMemoId: null,
  loading: false,
  setMemos: (memos) => set({ memos }),
  upsertMemo: (memo) => {
    const existing = get().memos.filter((item) => item.id !== memo.id)
    set({ memos: [memo, ...existing] })
  },
  updateMemo: (id, patch) => {
    set({
      memos: get().memos.map((memo) => (memo.id === id ? { ...memo, ...patch } : memo)),
    })
  },
  removeMemo: (id) => {
    set({
      memos: get().memos.filter((memo) => memo.id !== id),
      selectedMemoId: get().selectedMemoId === id ? null : get().selectedMemoId,
    })
  },
  selectMemo: (id) => set({ selectedMemoId: id }),
  clearSelection: () => set({ selectedMemoId: null }),
  loadMemos: async () => {
    set({ loading: true })
    try {
      const { memos } = await fetchMemos()
      set({ memos: memos.map(mapMemoResponse) })
    } finally {
      set({ loading: false })
    }
  },
  renameMemo: async (id, title) => {
    const memo = await renameMemoApi(id, title)
    get().updateMemo(id, {
      title: memo.title,
      updatedAt: formatUpdatedAt(memo.updatedAt),
    })
  },
  saveMemoWords: async (id, words) => {
    const memo = await saveMemoWordsApi(id, words)
    const savedWords = memo.words?.map((word, index) => ({
      id: word.id ?? index,
      word: word.word,
      start: word.start,
      end: word.end,
      speaker: word.speaker ?? undefined,
    }))
    get().updateMemo(id, {
      words: savedWords,
      preview: memo.preview,
      content: (savedWords ?? words).map((word) => word.word).join(' '),
      updatedAt: formatUpdatedAt(memo.updatedAt),
    })
  },
  deleteMemo: async (id) => {
    await deleteMemoApi(id)
    get().removeMemo(id)
  },
}))

export const getMemoById = (id: string, memos: Memo[]) =>
  memos.find((memo) => memo.id === id)
