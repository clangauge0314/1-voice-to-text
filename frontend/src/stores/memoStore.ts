import { create } from 'zustand'
import {
  deleteMemo as deleteMemoApi,
  fetchMemo,
  fetchMemos,
  renameMemo as renameMemoApi,
  saveMemoContent as saveMemoContentApi,
  generateWordAiNote as generateWordAiNoteApi,
  type MemoResponse,
  type MemoSegmentResponse,
  type MemoWordResponse,
} from '../lib/api'
import { useUsageStore } from './usageStore'

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
  note?: string
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
  ensureMemoLoaded: (id: string) => Promise<Memo>
  renameMemo: (id: string, title: string) => Promise<void>
  saveMemoWords: (id: string, words: MemoWord[]) => Promise<void>
  saveMemoContent: (
    id: string,
    content: { words: MemoWord[]; segments: MemoSegment[] },
  ) => Promise<void>
  generateWordAiNote: (id: string, wordIndex: number) => Promise<string>
  saveWordNote: (id: string, wordIndex: number, note: string) => Promise<void>
  deleteMemo: (id: string) => Promise<void>
}

function formatUpdatedAt(value: string) {
  return new Date(value).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function mapMemoSegments(segments: MemoSegmentResponse[] | undefined): MemoSegment[] | undefined {
  if (!Array.isArray(segments) || segments.length === 0) return undefined

  return segments.map((segment) => ({
    start: segment.start,
    end: segment.end,
    text: segment.text?.trim() || undefined,
    speaker: segment.speaker ?? undefined,
  }))
}

function mapMemoWords(words: MemoWordResponse[] | undefined): MemoWord[] | undefined {
  if (!Array.isArray(words) || words.length === 0) return undefined

  return words.map((word, index) => ({
    id: typeof word.id === 'number' ? word.id : index,
    word: word.word,
    start: word.start,
    end: word.end,
    speaker: word.speaker ?? undefined,
    note: word.note?.trim() || undefined,
  }))
}

export function mapMemoResponse(memo: MemoResponse): Memo {
  const words = mapMemoWords(memo.words)
  const segments = mapMemoSegments(memo.segments)

  return {
    id: memo.id,
    title: memo.title,
    preview: memo.preview,
    content: words ? words.map((word) => word.word).join(' ') : '',
    transcriptId: memo.transcriptId,
    uploadId: memo.uploadId,
    audioUrl: memo.audioUrl,
    duration: memo.duration ?? undefined,
    language: memo.language ?? undefined,
    speakers: memo.speakers,
    segmentCount: memo.segmentCount ?? segments?.length ?? undefined,
    wordCount: memo.wordCount ?? undefined,
    segments,
    words,
    updatedAt: formatUpdatedAt(memo.updatedAt),
  }
}

async function waitForMemoListLoad(getLoading: () => boolean) {
  for (let attempt = 0; attempt < 100 && getLoading(); attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
}

function mergeMemoList(existingMemos: Memo[], incomingMemos: Memo[]): Memo[] {
  const existingById = new Map(existingMemos.map((memo) => [memo.id, memo]))

  return incomingMemos.map((memo) => {
    const existing = existingById.get(memo.id)
    if (!existing) return memo

    return {
      ...memo,
      words: existing.words ?? memo.words,
      segments: existing.segments ?? memo.segments,
      speakers: existing.speakers?.length ? existing.speakers : memo.speakers,
      audioUrl: existing.audioUrl ?? memo.audioUrl,
      content: existing.content || memo.content,
      duration: existing.duration ?? memo.duration,
      language: existing.language ?? memo.language,
      segmentCount: existing.segmentCount ?? memo.segmentCount,
      wordCount: existing.wordCount ?? memo.wordCount,
    }
  })
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
      const incoming = memos.map(mapMemoResponse)
      set({ memos: mergeMemoList(get().memos, incoming) })
    } finally {
      set({ loading: false })
    }
  },
  ensureMemoLoaded: async (id) => {
    await waitForMemoListLoad(() => get().loading)

    const response = await fetchMemo(id)
    const memo = mapMemoResponse(response)
    get().upsertMemo(memo)
    return memo
  },
  renameMemo: async (id, title) => {
    const memo = await renameMemoApi(id, title)
    get().updateMemo(id, {
      title: memo.title,
      updatedAt: formatUpdatedAt(memo.updatedAt),
    })
  },
  saveMemoWords: async (id, words) => {
    const memo = getMemoById(id, get().memos)
    const segments = memo?.segments ?? []
    await get().saveMemoContent(id, { words, segments })
  },
  saveMemoContent: async (id, content) => {
    const memo = await saveMemoContentApi(id, content)
    const savedWords = memo.words?.map((word, index) => ({
      id: word.id ?? index,
      word: word.word,
      start: word.start,
      end: word.end,
      speaker: word.speaker ?? undefined,
      note: word.note?.trim() || undefined,
    }))
    const savedSegments = mapMemoSegments(memo.segments)
    get().updateMemo(id, {
      words: savedWords,
      segments: savedSegments,
      preview: memo.preview,
      segmentCount: memo.segmentCount ?? savedSegments?.length ?? undefined,
      content: (savedWords ?? content.words).map((word) => word.word).join(' '),
      updatedAt: formatUpdatedAt(memo.updatedAt),
    })
  },
  generateWordAiNote: async (id, wordIndex) => {
    const { note, memo, usage } = await generateWordAiNoteApi(id, wordIndex)
    if (usage) {
      useUsageStore.getState().setUsage(usage)
    }
    const savedWords = memo.words?.map((word, index) => ({
      id: word.id ?? index,
      word: word.word,
      start: word.start,
      end: word.end,
      speaker: word.speaker ?? undefined,
      note: word.note?.trim() || undefined,
    }))
    const savedSegments = mapMemoSegments(memo.segments)
    get().updateMemo(id, {
      words: savedWords,
      segments: savedSegments,
      preview: memo.preview,
      segmentCount: memo.segmentCount ?? savedSegments?.length ?? undefined,
      content: savedWords?.map((word) => word.word).join(' ') ?? '',
      updatedAt: formatUpdatedAt(memo.updatedAt),
    })
    return note
  },
  saveWordNote: async (id, wordIndex, note) => {
    const memo = getMemoById(id, get().memos)
    if (!memo?.words || wordIndex < 0 || wordIndex >= memo.words.length) return

    const trimmed = note.trim()
    const nextWords = memo.words.map((word, index) =>
      index === wordIndex ? { ...word, note: trimmed || undefined } : word,
    )

    await get().saveMemoWords(id, nextWords)
  },
  deleteMemo: async (id) => {
    await deleteMemoApi(id)
    get().removeMemo(id)
  },
}))

export const getMemoById = (id: string, memos: Memo[]) =>
  memos.find((memo) => memo.id === id)
