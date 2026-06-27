import { ChevronsDownUp, ChevronsUpDown, StickyNote } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getMemoById, useMemoStore } from '../../../stores/memoStore'
import { useMemoPlaybackStore } from '../../../stores/memoPlaybackStore'
import { useWordSelectionStore, EMPTY_SELECTED_INDICES } from '../../../stores/wordSelectionStore'
import { findActiveWordIndex, formatSpeakerLabel } from '../../../utils/transcriptToMemo'
import LyricsModeView from './LyricsModeView'
import type { WordNoteEditorRenderProps } from './types'
import { getDefaultOpenIndices, getScrollOffset } from './utils'
import VirtualWordNoteList, {
  VIRTUAL_SCROLL_THRESHOLD,
  type VirtualWordNoteListHandle,
} from './VirtualWordNoteList'
import WordNoteEditor from './WordNoteEditor'

const WordNotePanel = () => {
  const { id: memoId } = useParams()
  const memos = useMemoStore((state) => state.memos)
  const selectionMemoId = useWordSelectionStore((state) => state.memoId)
  const storeSelectedIndices = useWordSelectionStore((state) => state.selectedIndices)
  const selectedIndices =
    selectionMemoId === memoId ? storeSelectedIndices : EMPTY_SELECTED_INDICES
  const selectedIndexSet = useMemo(() => new Set(selectedIndices), [selectedIndices])

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const virtualListRef = useRef<VirtualWordNoteListHandle>(null)
  const itemRefs = useRef(new Map<number, HTMLElement>())
  const prevSelectionScrollRef = useRef<number | null>(null)
  const prevWordsLengthRef = useRef(0)
  const prevActiveWordRef = useRef(-1)
  const [openIndices, setOpenIndices] = useState<Set<number>>(new Set())

  const currentTime = useMemoPlaybackStore((state) => state.currentTime)
  const isPlaying = useMemoPlaybackStore((state) => state.isPlaying)
  const requestPause = useMemoPlaybackStore((state) => state.requestPause)
  const [forceListView, setForceListView] = useState(false)
  const memo = memoId ? getMemoById(memoId, memos) : undefined
  const words = memo?.words ?? []
  const speakers = memo?.speakers ?? []

  const activeWordIndex = useMemo(
    () => findActiveWordIndex(words, currentTime),
    [words, currentTime],
  )

  const isLyricsMode = isPlaying && !forceListView

  const showFullList = () => {
    setForceListView(true)
    requestPause()
  }

  const showCurrentWord = () => {
    setForceListView(false)
  }

  useEffect(() => {
    setForceListView(false)
    setOpenIndices(getDefaultOpenIndices(words))
    prevWordsLengthRef.current = words.length
    prevActiveWordRef.current = -1
  }, [memoId])

  useEffect(() => {
    if (isPlaying) {
      setForceListView(false)
    }
  }, [isPlaying])

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
    if (words.length >= VIRTUAL_SCROLL_THRESHOLD && virtualListRef.current) {
      virtualListRef.current.scrollToIndex(index, behavior)
      return
    }

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
  }, [words.length])

  const justExitedLyricsMode = useRef(false)

  useEffect(() => {
    if (!isLyricsMode) {
      justExitedLyricsMode.current = true
    }
  }, [isLyricsMode])

  useEffect(() => {
    if (isLyricsMode) return
    if (activeWordIndex < 0) return

    if (justExitedLyricsMode.current) {
      justExitedLyricsMode.current = false
      setTimeout(() => scrollActiveToCenter(activeWordIndex, 'auto'), 50)
      prevActiveWordRef.current = activeWordIndex
      return
    }

    if (activeWordIndex !== prevActiveWordRef.current) {
      const distance = prevActiveWordRef.current < 0 ? 0 : Math.abs(activeWordIndex - prevActiveWordRef.current)
      prevActiveWordRef.current = activeWordIndex
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
  const useVirtualList = words.length >= VIRTUAL_SCROLL_THRESHOLD

  const renderWordEditor = ({
    word,
    index,
    speakerLabel,
    isOpen,
    isHighlighted,
    isActive,
    onToggle,
    editorRef,
  }: WordNoteEditorRenderProps) => (
    <WordNoteEditor
      key={`word-${word.id}-${index}`}
      memoId={memoId}
      wordIndex={index}
      word={word}
      speakerLabel={speakerLabel}
      isOpen={isOpen}
      isHighlighted={isHighlighted}
      isActive={isActive}
      onToggle={onToggle}
      editorRef={editorRef}
    />
  )

  const renderWordItems = () => {
    if (useVirtualList) {
      return (
        <VirtualWordNoteList
          ref={virtualListRef}
          scrollContainerRef={scrollContainerRef}
          words={words}
          speakers={speakers}
          openIndices={openIndices}
          activeWordIndex={activeWordIndex}
          selectedIndexSet={selectedIndexSet}
          renderEditor={renderWordEditor}
          onToggleWord={toggleWord}
          itemRefs={itemRefs}
        />
      )
    }

    return words.map((word, index) => {
      const speakerIndex = speakers.indexOf(word.speaker ?? '')
      const speakerLabel = formatSpeakerLabel(
        word.speaker,
        speakerIndex >= 0 ? speakerIndex : 0,
      )

      return renderWordEditor({
        word,
        index,
        speakerLabel,
        isOpen: openIndices.has(index),
        isHighlighted: selectedIndexSet.has(index),
        isActive: index === activeWordIndex,
        onToggle: () => toggleWord(index),
        editorRef: (element) => {
          if (element) {
            itemRefs.current.set(index, element)
          } else {
            itemRefs.current.delete(index)
          }
        },
      })
    })
  }

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
                onClick={showFullList}
                className="flex h-6 items-center justify-center rounded border border-black/15 px-2 text-[10px] font-medium text-black/60 transition-colors hover:border-black/30 hover:text-black dark:border-white/15 dark:text-white/60 dark:hover:border-white/30 dark:hover:text-white"
              >
                전체 목록 보기
              </button>
            ) : isPlaying ? (
              <button
                type="button"
                onClick={showCurrentWord}
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
            <LyricsModeView
              memoId={memoId}
              activeWordIndex={activeWordIndex}
              activeWord={activeWord}
              speakers={speakers}
            />
          ) : (
            <div className="flex h-full items-center justify-center p-4">
              <p className="text-sm text-black/50 dark:text-white/50">재생 위치에 단어가 없습니다.</p>
            </div>
          )}
        </div>
      ) : (
        <div ref={scrollContainerRef} className="scrollbar-modern min-h-0 flex-1 overflow-y-auto">
          <div className={useVirtualList ? '' : 'space-y-2 py-2'}>{renderWordItems()}</div>
        </div>
      )}
    </div>
  )
}

export default WordNotePanel
