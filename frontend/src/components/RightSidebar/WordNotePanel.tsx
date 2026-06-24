import { ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, Loader2, StickyNote } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { getMemoById, useMemoStore, type MemoWord } from '../../stores/memoStore'
import { useMemoPlaybackStore } from '../../stores/memoPlaybackStore'
import { useWordSelectionStore, EMPTY_SELECTED_INDICES } from '../../stores/wordSelectionStore'
import {
  findActiveWordIndex,
  formatPreciseTimestamp,
  formatSpeakerLabel,
} from '../../utils/transcriptToMemo'

const NOTE_SAVE_DELAY_MS = 600

function getScrollOffset(container: HTMLElement, element: HTMLElement) {
  const containerRect = container.getBoundingClientRect()
  const elementRect = element.getBoundingClientRect()
  return container.scrollTop + (elementRect.top - containerRect.top)
}

const PlaybackTextarea = ({
  memoId,
  wordIndex,
  word,
}: {
  memoId: string
  wordIndex: number
  word: MemoWord
}) => {
  const saveWordNote = useMemoStore((state) => state.saveWordNote)
  const [draft, setDraft] = useState(word.note ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const saveTimerRef = useRef<number | null>(null)
  const lastSavedRef = useRef(word.note ?? '')

  useEffect(() => {
    const nextNote = word.note ?? ''
    setDraft(nextNote)
    lastSavedRef.current = nextNote
  }, [word.note, wordIndex])

  const flushSave = useCallback(
    async (value: string) => {
      if (value === lastSavedRef.current) return

      setIsSaving(true)
      try {
        await saveWordNote(memoId, wordIndex, value)
        lastSavedRef.current = value.trim()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : '단어 메모 저장에 실패했습니다.')
      } finally {
        setIsSaving(false)
      }
    },
    [memoId, saveWordNote, wordIndex],
  )

  useEffect(() => {
    return () => {
      if (saveTimerRef.current != null) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  const scheduleSave = (value: string) => {
    if (saveTimerRef.current != null) {
      window.clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = window.setTimeout(() => {
      void flushSave(value)
    }, NOTE_SAVE_DELAY_MS)
  }

  const handleChange = (value: string) => {
    setDraft(value)
    scheduleSave(value)
  }

  const handleBlur = () => {
    if (saveTimerRef.current != null) {
      window.clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    void flushSave(draft)
  }

  return (
    <div className="relative flex h-full flex-col">
      <textarea
        value={draft}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={handleBlur}
        placeholder="이 단어에 대한 메모를 입력하세요"
        className="scrollbar-modern w-full flex-1 resize-none rounded-md border border-black/15 bg-white px-2.5 py-2 text-sm leading-relaxed text-black outline-none transition-colors placeholder:text-black/35 focus:border-black/40 dark:border-white/15 dark:bg-black dark:text-white dark:placeholder:text-white/35 dark:focus:border-white/40"
      />
      {isSaving && (
        <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-white/90 px-1.5 py-0.5 text-[10px] text-black/60 shadow-sm backdrop-blur-sm dark:bg-black/90 dark:text-white/60">
          <Loader2 size={10} className="animate-spin" />
          저장 중
        </span>
      )}
    </div>
  )
}

interface WordNoteEditorProps {
  memoId: string
  wordIndex: number
  word: MemoWord
  speakerLabel: string
  isOpen: boolean
  isHighlighted?: boolean
  isActive?: boolean
  onToggle: () => void
  editorRef?: (element: HTMLElement | null) => void
}

const WordNoteEditor = ({
  memoId,
  wordIndex,
  word,
  speakerLabel,
  isOpen,
  isHighlighted = false,
  isActive = false,
  onToggle,
  editorRef,
}: WordNoteEditorProps) => {
  const saveWordNote = useMemoStore((state) => state.saveWordNote)
  const [draft, setDraft] = useState(word.note ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const saveTimerRef = useRef<number | null>(null)
  const lastSavedRef = useRef(word.note ?? '')

  useEffect(() => {
    const nextNote = word.note ?? ''
    setDraft(nextNote)
    lastSavedRef.current = nextNote
  }, [word.note, wordIndex])

  const flushSave = useCallback(
    async (value: string) => {
      if (value === lastSavedRef.current) return

      setIsSaving(true)
      try {
        await saveWordNote(memoId, wordIndex, value)
        lastSavedRef.current = value.trim()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : '단어 메모 저장에 실패했습니다.')
      } finally {
        setIsSaving(false)
      }
    },
    [memoId, saveWordNote, wordIndex],
  )

  useEffect(() => {
    return () => {
      if (saveTimerRef.current != null) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  const scheduleSave = (value: string) => {
    if (saveTimerRef.current != null) {
      window.clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = window.setTimeout(() => {
      void flushSave(value)
    }, NOTE_SAVE_DELAY_MS)
  }

  const handleChange = (value: string) => {
    setDraft(value)
    scheduleSave(value)
  }

  const handleBlur = () => {
    if (saveTimerRef.current != null) {
      window.clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    void flushSave(draft)
  }

  const timeLabel =
    word.start != null || word.end != null
      ? `${formatPreciseTimestamp(word.start)} – ${formatPreciseTimestamp(word.end)}`
      : null

  const hasNote = Boolean(word.note?.trim())
  const metaParts = [`#${wordIndex + 1}`, speakerLabel, timeLabel].filter(Boolean)

  return (
    <article
      ref={editorRef}
      className={`overflow-hidden rounded-lg border transition-colors duration-300 ${
        isActive
          ? 'border-black/25 bg-black/[0.07] dark:border-white/25 dark:bg-white/[0.07]'
          : `bg-black/[0.02] dark:bg-white/[0.03] ${
              isHighlighted
                ? 'border-black/50 ring-2 ring-black/15 dark:border-white/50 dark:ring-white/15'
                : hasNote
                  ? 'border-amber-500/35 dark:border-amber-400/35'
                  : 'border-black/15 dark:border-white/15'
            }`
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-2 p-3 text-left transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
        aria-expanded={isOpen}
      >
        <span className="mt-0.5 shrink-0 text-black/40 dark:text-white/40">
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-black dark:text-white">{word.word}</span>
            {hasNote && !isOpen && (
              <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
                메모
              </span>
            )}
          </span>
          <span className="mt-0.5 block text-[10px] text-black/45 dark:text-white/45">
            {metaParts.join(' · ')}
          </span>
          {!isOpen && hasNote && (
            <span className="mt-1 line-clamp-2 text-xs text-black/55 dark:text-white/55">
              {word.note?.trim()}
            </span>
          )}
        </span>
        {isSaving && (
          <span className="flex shrink-0 items-center gap-1 text-[10px] text-black/45 dark:text-white/45">
            <Loader2 size={11} className="animate-spin" />
            저장 중
          </span>
        )}
      </button>

      {isOpen && (
        <div className="border-t border-black/10 px-3 pb-3 pt-2 dark:border-white/10">
          <textarea
            value={draft}
            onChange={(event) => handleChange(event.target.value)}
            onBlur={handleBlur}
            placeholder="이 단어에 대한 메모를 입력하세요"
            rows={2}
            className="scrollbar-modern w-full resize-y rounded-md border border-black/15 bg-white px-2.5 py-2 text-sm leading-relaxed text-black outline-none transition-colors placeholder:text-black/35 focus:border-black/40 dark:border-white/15 dark:bg-black dark:text-white dark:placeholder:text-white/35 dark:focus:border-white/40"
          />
        </div>
      )}
    </article>
  )
}

const WordNotePanel = () => {
  const { id: memoId } = useParams()
  const memos = useMemoStore((state) => state.memos)
  const selectionMemoId = useWordSelectionStore((state) => state.memoId)
  const storeSelectedIndices = useWordSelectionStore((state) => state.selectedIndices)
  const selectedIndices =
    selectionMemoId === memoId ? storeSelectedIndices : EMPTY_SELECTED_INDICES
  const selectedIndexSet = useMemo(() => new Set(selectedIndices), [selectedIndices])

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef(new Map<number, HTMLElement>())
  const prevSelectionScrollRef = useRef<number | null>(null)
  const prevWordsLengthRef = useRef(0)
  const prevActiveWordRef = useRef(-1)
  const [openIndices, setOpenIndices] = useState<Set<number>>(new Set())

  const currentTime = useMemoPlaybackStore((state) => state.currentTime)
  const isPlaying = useMemoPlaybackStore((state) => state.isPlaying)
  const memo = memoId ? getMemoById(memoId, memos) : undefined
  const words = memo?.words ?? []
  const speakers = memo?.speakers ?? []

  const activeWordIndex = useMemo(
    () => findActiveWordIndex(words, currentTime),
    [words, currentTime],
  )

  const isLyricsMode = isPlaying

  useEffect(() => {
    setOpenIndices(new Set(words.map((_, index) => index)))
    prevWordsLengthRef.current = words.length
  }, [memoId])

  useEffect(() => {
    const prevLength = prevWordsLengthRef.current
    if (words.length === prevLength) return

    setOpenIndices((prev) => {
      const next = new Set<number>()
      for (let index = 0; index < words.length; index += 1) {
        if (index < prevLength && prev.has(index)) {
          next.add(index)
        } else if (index >= prevLength) {
          next.add(index)
        }
      }
      return next
    })
    prevWordsLengthRef.current = words.length
  }, [words.length])

  const toggleWord = (index: number) => {
    setOpenIndices((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const expandAll = () => {
    setOpenIndices(new Set(words.map((_, index) => index)))
  }

  const collapseAll = () => {
    setOpenIndices(new Set())
  }

  const allOpen = words.length > 0 && openIndices.size === words.length

  const handleToggleAll = () => {
    if (allOpen) collapseAll()
    else expandAll()
  }

  const scrollActiveToCenter = useCallback((index: number, behavior: ScrollBehavior) => {
    const container = scrollContainerRef.current
    const element = itemRefs.current.get(index)
    if (!container || !element) return

    const elementTop = getScrollOffset(container, element)
    const targetScroll = elementTop - container.clientHeight / 2 + element.clientHeight / 2
    const maxScroll = container.scrollHeight - container.clientHeight

    container.scrollTo({
      top: Math.max(0, Math.min(targetScroll, maxScroll)),
      behavior,
    })
  }, [])

  const justExitedLyricsMode = useRef(false)

  useEffect(() => {
    if (!isLyricsMode) {
      justExitedLyricsMode.current = true
    }
  }, [isLyricsMode])

  useEffect(() => {
    if (isLyricsMode) return
    if (activeWordIndex < 0) return

    // 단일 단어 모드에서 방금 막 리스트 뷰로 전환된 경우
    if (justExitedLyricsMode.current) {
      justExitedLyricsMode.current = false
      // 약간의 지연을 주어 DOM 렌더링이 완료된 후 스크롤
      setTimeout(() => scrollActiveToCenter(activeWordIndex, 'auto'), 50)
      prevActiveWordRef.current = activeWordIndex
      return
    }

    // 재생 중이면서 전체 리스트를 보는 상태에서 활성 단어가 바뀌는 경우 자동 스크롤
    if (activeWordIndex !== prevActiveWordRef.current) {
      const distance = prevActiveWordRef.current < 0 ? 0 : Math.abs(activeWordIndex - prevActiveWordRef.current)
      prevActiveWordRef.current = activeWordIndex
      // 사용자가 직접 선택한 단어가 없는 경우에만 자동 스크롤
      if (selectedIndices.length === 0) {
        scrollActiveToCenter(activeWordIndex, distance > 1 ? 'auto' : 'smooth')
      }
    }
  }, [isLyricsMode, activeWordIndex, scrollActiveToCenter, selectedIndices.length])

  useEffect(() => {
    if (isLyricsMode) return

    const scrollTarget = selectedIndices[0]
    if (scrollTarget == null || scrollTarget === prevSelectionScrollRef.current) return

    prevSelectionScrollRef.current = scrollTarget
    // 약간의 지연을 주어 리스트 렌더링 후 스크롤 보장
    setTimeout(() => scrollActiveToCenter(scrollTarget, 'smooth'), 50)
  }, [isLyricsMode, selectedIndices, scrollActiveToCenter])

  useEffect(() => {
    if (selectedIndices.length === 0) {
      prevSelectionScrollRef.current = null
    }
  }, [selectedIndices.length])

  const activeWord =
    activeWordIndex >= 0 && activeWordIndex < words.length ? words[activeWordIndex] : null

  if (!memoId || !memo) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center px-4 py-10 text-center">
        <p className="text-sm text-black/50 dark:text-white/50">메모를 불러오는 중...</p>
      </div>
    )
  }

  if (words.length === 0) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center px-4 py-10 text-center">
        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-black/15 bg-white dark:border-white/15 dark:bg-black">
          <StickyNote size={18} strokeWidth={1.75} className="text-black/60 dark:text-white/60" />
        </span>
        <p className="text-sm font-medium text-black dark:text-white">단어가 없습니다</p>
        <p className="mt-2 max-w-[15rem] text-xs leading-relaxed text-black/50 dark:text-white/50">
          전사가 완료되면 모든 단어가 이곳에 표시됩니다.
        </p>
      </div>
    )
  }

  const noteCount = words.filter((word) => word.note?.trim()).length

  // 더 이상 필터링하지 않고 항상 전체 단어를 렌더링합니다
  const renderWordItems = () =>
    words.map((word, index) => {
      const speakerIndex = speakers.indexOf(word.speaker ?? '')
      const speakerLabel = formatSpeakerLabel(
        word.speaker,
        speakerIndex >= 0 ? speakerIndex : 0,
      )
      const isActive = index === activeWordIndex

      return (
        <WordNoteEditor
          key={word.id || index}
          memoId={memoId}
          wordIndex={index}
          word={word}
          speakerLabel={speakerLabel}
          isOpen={openIndices.has(index)}
          isHighlighted={selectedIndexSet.has(index)}
          isActive={isActive}
          onToggle={() => toggleWord(index)}
          editorRef={(element) => {
            if (element) {
              itemRefs.current.set(index, element)
            } else {
              itemRefs.current.delete(index)
            }
          }}
        />
      )
    })

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 pb-2">
        <div className="flex items-center justify-between gap-2 px-1">
          <p className="text-xs text-black/45 dark:text-white/45">
            {isLyricsMode ? (
              <>재생 중 · 현재 단어만 표시 중</>
            ) : isPlaying ? (
              <>재생 중 · 전체 목록 보임</>
            ) : (
              <>
                총 {words.length}개
                {noteCount > 0 ? ` · 메모 ${noteCount}개` : ''}
              </>
            )}
          </p>

          <div className="flex items-center gap-1">
            {isLyricsMode ? (
              <button
                type="button"
                onClick={() => setForceListView(true)}
                className="flex h-6 items-center justify-center rounded border border-black/15 px-2 text-[10px] font-medium text-black/60 transition-colors hover:border-black/30 hover:text-black dark:border-white/15 dark:text-white/60 dark:hover:border-white/30 dark:hover:text-white"
              >
                전체 목록 보기
              </button>
            ) : isPlaying ? (
              <button
                type="button"
                onClick={() => setForceListView(false)}
                className="flex h-6 items-center justify-center rounded border border-black/15 px-2 text-[10px] font-medium text-black/60 transition-colors hover:border-black/30 hover:text-black dark:border-white/15 dark:text-white/60 dark:hover:border-white/30 dark:hover:text-white"
              >
                현재 단어 보기
              </button>
            ) : (
              <button
                type="button"
                onClick={handleToggleAll}
                aria-label={allOpen ? '전체 닫기' : '전체 열기'}
                title={allOpen ? '전체 닫기' : '전체 열기'}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-black/15 text-black/60 transition-colors hover:border-black/30 hover:text-black dark:border-white/15 dark:text-white/60 dark:hover:border-white/30 dark:hover:text-white"
              >
                {allOpen ? <ChevronsDownUp size={13} /> : <ChevronsUpDown size={13} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {isLyricsMode ? (
        <div className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-modern">
          {activeWord ? (
            <div className="flex flex-col p-3">
              <div className="flex flex-col rounded-xl border border-black/[0.12] bg-black/[0.06] shadow-sm dark:border-white/[0.12] dark:bg-white/[0.06]">
                <div className="flex-none px-4 py-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex rounded bg-black/10 px-1.5 py-0.5 text-[10px] font-bold text-black/60 dark:bg-white/10 dark:text-white/60">
                      재생 중
                    </span>
                  </div>
                  <p className="mt-3 truncate text-xl font-bold text-black dark:text-white">
                    {activeWord.word}
                  </p>
                  <p className="mt-1 truncate text-xs text-black/45 dark:text-white/45">
                    {[`#${activeWordIndex + 1}`, formatSpeakerLabel(activeWord.speaker, speakers.indexOf(activeWord.speaker ?? '') >= 0 ? speakers.indexOf(activeWord.speaker ?? '') : 0), activeWord.start != null || activeWord.end != null ? `${formatPreciseTimestamp(activeWord.start)} – ${formatPreciseTimestamp(activeWord.end)}` : null].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="px-3 pb-3">
                  <PlaybackTextarea
                    key={activeWordIndex}
                    memoId={memoId}
                    wordIndex={activeWordIndex}
                    word={activeWord}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-4">
              <p className="text-sm text-black/50 dark:text-white/50">재생 위치에 단어가 없습니다.</p>
            </div>
          )}
        </div>
      ) : (
        <div ref={scrollContainerRef} className="scrollbar-modern min-h-0 flex-1 overflow-y-auto">
          {words.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-4 text-center">
              <p className="text-sm text-black/50 dark:text-white/50">단어가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2 py-2">{renderWordItems()}</div>
          )}
        </div>
      )}
    </div>
  )
}

export default WordNotePanel
