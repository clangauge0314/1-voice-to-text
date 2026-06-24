import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { Merge, Scissors, X } from 'lucide-react'
import { toast } from 'sonner'
import type { MemoSegment, MemoWord } from '../../stores/memoStore'
import { useWordSelectionStore } from '../../stores/wordSelectionStore'
import {
  applyWordMergeWithSegments,
  applyWordSplitWithSegments,
  canMergeSelectedIndices,
  canMergeSelectedSegmentIndices,
  canSplitSelectedIndices,
  findActiveSegmentIndex,
  findActiveWordIndex,
  formatPreciseTimestamp,
  formatSpeakerLabel,
  formatTimestamp,
  getSpeakerColor,
  groupWordsBySegments,
  mergeSelectedSegments,
  splitWordAtIndex,
  splitWordsAtIndices,
  syncSegmentTextsFromWords,
  SPEAKER_COLORS,
} from '../../utils/transcriptToMemo'

function shouldSelectOnClick(
  event: { ctrlKey: boolean; metaKey: boolean; pointerType?: string },
  isCoarsePointer: boolean,
) {
  if (event.pointerType === 'touch') return true
  if (isCoarsePointer) return true
  return event.ctrlKey || event.metaKey
}

function shouldSelectOnPointerDown(
  event: { ctrlKey: boolean; metaKey: boolean; pointerType: string },
  isCoarsePointer: boolean,
) {
  if (event.pointerType === 'touch') return true
  if (isCoarsePointer && event.pointerType !== 'mouse') return true
  return event.ctrlKey || event.metaKey
}

interface ContextMenuState {
  x: number
  y: number
  wordIndex: number
}

interface WordDetailTooltipProps {
  word: MemoWord
  speakers: string[]
  anchorRef: RefObject<HTMLElement | null>
  visible: boolean
}

const WordDetailTooltip = ({ word, speakers, anchorRef, visible }: WordDetailTooltipProps) => {
  const [position, setPosition] = useState({ top: 0, left: 0 })

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current
    if (!anchor) return

    const rect = anchor.getBoundingClientRect()
    setPosition({
      top: rect.top - 8,
      left: rect.left + rect.width / 2,
    })
  }, [anchorRef])

  useEffect(() => {
    if (!visible) return

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [visible, updatePosition])

  const speakerIndex = speakers.indexOf(word.speaker ?? '')
  const speakerLabel = formatSpeakerLabel(
    word.speaker,
    speakerIndex >= 0 ? speakerIndex : 0,
  )
  const duration =
    word.start != null && word.end != null
      ? Math.max(0, word.end - word.start)
      : null

  const rows = [
    { label: '단어', value: word.word },
    {
      label: '시간',
      value:
        word.start != null || word.end != null
          ? `${formatPreciseTimestamp(word.start)} – ${formatPreciseTimestamp(word.end)}`
          : '-',
      mono: true,
    },
    {
      label: '길이',
      value: duration != null ? `${duration.toFixed(2)}초` : '-',
      mono: true,
    },
    { label: '화자', value: speakerLabel },
    ...(word.note?.trim()
      ? [{ label: '메모', value: word.note.trim() }]
      : []),
    { label: 'ID', value: String(word.id), mono: true },
  ]

  if (!visible) return null

  return createPortal(
    <div
      className="pointer-events-none fixed z-9999 w-52 -translate-x-1/2 -translate-y-full rounded-lg border border-black/10 bg-white p-3 text-left shadow-lg dark:border-white/15 dark:bg-neutral-950"
      style={{ top: position.top, left: position.left }}
      role="tooltip"
    >
      <p className="mb-2 break-words border-b border-black/8 pb-2 text-sm font-semibold [overflow-wrap:anywhere] text-black dark:border-white/10 dark:text-white">
        {word.word}
      </p>
      <dl className="space-y-1.5">
        {rows.slice(1).map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-3 text-xs">
            <dt className="shrink-0 text-black/45 dark:text-white/45">{row.label}</dt>
            <dd
              className={`text-right text-black dark:text-white ${
                row.mono ? 'font-mono' : ''
              }`}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>,
    document.body,
  )
}

interface WordContextMenuProps {
  menu: ContextMenuState
  canMerge: boolean
  canSplit: boolean
  canSeek: boolean
  hasSelection: boolean
  mergePreview: string | null
  splitPreview: string | null
  onMerge: () => void
  onSplit: () => void
  onSeek: () => void
  onClearSelection: () => void
  onClose: () => void
}

const WordContextMenu = ({
  menu,
  canMerge,
  canSplit,
  canSeek,
  hasSelection,
  mergePreview,
  splitPreview,
  onMerge,
  onSplit,
  onSeek,
  onClearSelection,
  onClose,
}: WordContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handlePointerDown = (event: Event) => {
      if (menuRef.current?.contains(event.target as Node)) return
      onClose()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', onClose, true)

    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', onClose, true)
    }
  }, [onClose])

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-9999 min-w-40 overflow-hidden rounded-md border border-black/15 bg-white py-1 shadow-lg dark:border-white/15 dark:bg-neutral-950"
      style={{ top: menu.y, left: menu.x }}
      role="menu"
    >
      {canMerge && (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onMerge()
            onClose()
          }}
          className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm text-black transition-colors hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
        >
          <span>합치기 (Ctrl+M)</span>
          {mergePreview && (
            <span className="text-xs text-black/50 dark:text-white/50">{mergePreview}</span>
          )}
        </button>
      )}
      {canSplit && (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onSplit()
            onClose()
          }}
          className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm text-black transition-colors hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
        >
          <span>나누기 (Ctrl+Shift+M)</span>
          {splitPreview && (
            <span className="text-xs text-black/50 dark:text-white/50">{splitPreview}</span>
          )}
        </button>
      )}
      {canSeek && (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onSeek()
            onClose()
          }}
          className="w-full px-3 py-2 text-left text-sm text-black transition-colors hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
        >
          이 위치로 이동
        </button>
      )}
      {hasSelection && (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onClearSelection()
            onClose()
          }}
          className="w-full px-3 py-2 text-left text-sm text-black transition-colors hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
        >
          선택 해제
        </button>
      )}
    </div>,
    document.body,
  )
}

interface WordChipProps {
  word: MemoWord
  wordIndex: number
  speakers: string[]
  isActive: boolean
  isSelected: boolean
  isEditing: boolean
  draft: string
  canSeek: boolean
  canEdit: boolean
  onDraftChange: (value: string) => void
  onCommit: () => void
  onCancel: () => void
  onStartEdit: () => void
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
  onContextMenu: (event: MouseEvent<HTMLButtonElement>) => void
  onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void
  onPointerEnter: () => void
  onPointerUp: () => void
}

const WordChip = ({
  word,
  wordIndex,
  speakers,
  isActive,
  isSelected,
  isEditing,
  draft,
  canSeek,
  canEdit,
  onDraftChange,
  onCommit,
  onCancel,
  onStartEdit,
  onClick,
  onContextMenu,
  onPointerDown,
  onPointerEnter,
  onPointerUp,
}: WordChipProps) => {
  const anchorRef = useRef<HTMLSpanElement>(null)
  const [tooltipVisible, setTooltipVisible] = useState(false)

  if (isEditing) {
    return (
      <input
        key={`edit-${word.id}-${wordIndex}`}
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        onBlur={() => void onCommit()}
        onKeyDown={(event) => {
          if (event.key === 'Enter') void onCommit()
          if (event.key === 'Escape') onCancel()
        }}
        size={Math.max(draft.length, word.word.length, 8)}
        className="inline max-w-full rounded border border-black/30 bg-transparent px-1.5 py-0.5 text-sm text-black outline-none focus:border-black dark:border-white/30 dark:text-white dark:focus:border-white"
        autoFocus
      />
    )
  }

  return (
    <span
      ref={anchorRef}
      className="relative inline-flex max-w-full"
      onMouseEnter={() => setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
    >
      <WordDetailTooltip
        word={word}
        speakers={speakers}
        anchorRef={anchorRef}
        visible={tooltipVisible}
      />
      <button
        type="button"
        onPointerDown={(event) => {
          if (event.button !== 0 || !canEdit) return
          event.preventDefault()
          onPointerDown(event)
        }}
        onPointerUp={onPointerUp}
        onPointerEnter={onPointerEnter}
        onClick={onClick}
        onContextMenu={onContextMenu}
        onDoubleClick={() => {
          if (canEdit) onStartEdit()
        }}
        className={`relative inline max-w-full select-none rounded border px-1.5 py-0.5 text-left break-words [overflow-wrap:anywhere] transition-colors ${
          isActive
            ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
            : isSelected
              ? 'border-black/60 bg-black/10 ring-2 ring-black/25 dark:border-white/60 dark:bg-white/10 dark:ring-white/25'
              : word.note?.trim()
                ? 'border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60 hover:bg-amber-500/10 dark:border-amber-400/40 dark:bg-amber-400/5 dark:hover:border-amber-400/60 dark:hover:bg-amber-400/10'
                : 'border-black/20 hover:border-black/40 hover:bg-black/5 dark:border-white/20 dark:hover:border-white/40 dark:hover:bg-white/10'
        } ${canSeek || canEdit ? 'cursor-pointer' : 'cursor-default'}`}
      >
        {word.note?.trim() && (
          <span
            className="absolute -right-1 -top-1 h-2 w-2 rounded-full border border-white bg-amber-500 dark:border-black dark:bg-amber-400"
            aria-label="메모 있음"
          />
        )}
        {word.word}
      </button>
    </span>
  )
}

interface TranscriptSnapshot {
  words: MemoWord[]
  segments: MemoSegment[]
}

interface WordActionBarProps {
  canMergeWords: boolean
  canMergeSegments: boolean
  canSplit: boolean
  mergePreview: string | null
  segmentMergePreview: string | null
  splitPreview: string | null
  onMergeWords: () => void
  onMergeSegments: () => void
  onSplit: () => void
  onClearSelection: () => void
}

const WordActionBar = ({
  canMergeWords,
  canMergeSegments,
  canSplit,
  mergePreview,
  segmentMergePreview,
  splitPreview,
  onMergeWords,
  onMergeSegments,
  onSplit,
  onClearSelection,
}: WordActionBarProps) => (
  <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-black/15 bg-black/[0.02] px-3 py-2 dark:border-white/15 dark:bg-white/[0.03]">
    <span className="text-xs text-black/50 dark:text-white/50">선택됨</span>
    {canMergeWords && (
      <button
        type="button"
        onClick={onMergeWords}
        className="inline-flex items-center gap-1.5 rounded-md border border-black/20 px-2.5 py-1 text-xs font-medium text-black transition-colors hover:bg-black hover:text-white dark:border-white/20 dark:text-white dark:hover:bg-white dark:hover:text-black"
        title={mergePreview ?? '단어 합치기'}
      >
        <Merge size={13} />
        단어 합치기
        <span className="text-black/40 dark:text-white/40">Ctrl+M</span>
      </button>
    )}
    {canMergeSegments && (
      <button
        type="button"
        onClick={onMergeSegments}
        className="inline-flex items-center gap-1.5 rounded-md border border-black/20 px-2.5 py-1 text-xs font-medium text-black transition-colors hover:bg-black hover:text-white dark:border-white/20 dark:text-white dark:hover:bg-white dark:hover:text-black"
        title={segmentMergePreview ?? '문장 합치기'}
      >
        <Merge size={13} />
        문장 합치기
      </button>
    )}
    {canSplit && (
      <button
        type="button"
        onClick={onSplit}
        className="inline-flex items-center gap-1.5 rounded-md border border-black/20 px-2.5 py-1 text-xs font-medium text-black transition-colors hover:bg-black hover:text-white dark:border-white/20 dark:text-white dark:hover:bg-white dark:hover:text-black"
        title={splitPreview ?? '나누기'}
      >
        <Scissors size={13} />
        나누기
        <span className="text-black/40 dark:text-white/40">Ctrl+Shift+M</span>
      </button>
    )}
    <button
      type="button"
      onClick={onClearSelection}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-black/50 transition-colors hover:bg-black/5 hover:text-black dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white"
    >
      <X size={13} />
      선택 해제
    </button>
  </div>
)

interface MemoTranscriptEditorProps {
  memoId?: string
  segments?: MemoSegment[]
  words?: MemoWord[]
  speakers: string[]
  currentTime: number
  canSeek: boolean
  onSeek: (time?: number) => void
  onSaveContent?: (content: TranscriptSnapshot) => Promise<void>
}

const MemoTranscriptEditor = ({
  memoId,
  segments = [],
  words = [],
  speakers,
  currentTime,
  canSeek,
  onSeek,
  onSaveContent,
}: MemoTranscriptEditorProps) => {
  const [optimisticWords, setOptimisticWords] = useState<MemoWord[] | null>(null)
  const [optimisticSegments, setOptimisticSegments] = useState<MemoSegment[] | null>(null)
  
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const [selectedSegmentIndices, setSelectedSegmentIndices] = useState<number[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const activeSegmentRef = useRef<HTMLDivElement | null>(null)
  const dragAnchorRef = useRef(-1)
  const dragSelectEnabledRef = useRef(false)
  const didDragRef = useRef(false)
  const segmentDragAnchorRef = useRef(-1)
  const segmentDragSelectEnabledRef = useRef(false)
  const segmentDidDragRef = useRef(false)
  const undoStackRef = useRef<TranscriptSnapshot[]>([])
  const displayWordsRef = useRef(words)
  const displaySegmentsRef = useRef(segments)
  const skipContentResetRef = useRef(false)
  const prevMemoIdRef = useRef(memoId)
  const setWordSelection = useWordSelectionStore((state) => state.setSelection)
  const clearWordSelection = useWordSelectionStore((state) => state.clearSelection)

  const isCoarsePointer = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(pointer: coarse)').matches
  }, [])

  const displayWords = optimisticWords ?? words
  const displaySegments = optimisticSegments ?? segments
  displayWordsRef.current = displayWords
  displaySegmentsRef.current = displaySegments

  const cloneWords = (source: MemoWord[]) => source.map((word) => ({ ...word }))
  const cloneSegments = (source: MemoSegment[]) => source.map((segment) => ({ ...segment }))
  const getSnapshot = useCallback(
    (): TranscriptSnapshot => ({
      words: cloneWords(displayWordsRef.current),
      segments: cloneSegments(displaySegmentsRef.current),
    }),
    [],
  )

  useEffect(() => {
    if (prevMemoIdRef.current === memoId) return

    prevMemoIdRef.current = memoId
    undoStackRef.current = []
    clearWordSelection()
    setOptimisticWords(null)
    setOptimisticSegments(null)
    setSelectedIndices([])
    setSelectedSegmentIndices([])
    setContextMenu(null)
    setEditingIndex(null)
    dragAnchorRef.current = -1
    dragSelectEnabledRef.current = false
    segmentDragAnchorRef.current = -1
    segmentDragSelectEnabledRef.current = false
    segmentDidDragRef.current = false
  }, [memoId, clearWordSelection])

  useEffect(() => {
    if (!memoId || !onSaveContent) {
      clearWordSelection()
      return
    }

    setWordSelection(memoId, selectedIndices)
  }, [memoId, onSaveContent, selectedIndices, setWordSelection, clearWordSelection])

  useEffect(() => {
    if (skipContentResetRef.current) {
      skipContentResetRef.current = false
      setOptimisticWords(null)
      setOptimisticSegments(null)
      return
    }

    setOptimisticWords(null)
    setOptimisticSegments(null)
    setSelectedIndices([])
    setSelectedSegmentIndices([])
    setContextMenu(null)
    setEditingIndex(null)
    undoStackRef.current = []
    dragAnchorRef.current = -1
    dragSelectEnabledRef.current = false
    didDragRef.current = false
    segmentDragAnchorRef.current = -1
    segmentDragSelectEnabledRef.current = false
    segmentDidDragRef.current = false
  }, [words, segments])

  const saveContent = useCallback(
    async (next: TranscriptSnapshot) => {
      if (!onSaveContent) return

      setOptimisticWords(next.words)
      setOptimisticSegments(next.segments)
      setIsSaving(true)

      try {
        skipContentResetRef.current = true
        await onSaveContent(next)
      } catch {
        setOptimisticWords(null)
        setOptimisticSegments(null)
        throw new Error('save failed')
      } finally {
        setIsSaving(false)
      }
    },
    [onSaveContent],
  )

  const pushUndoSnapshot = useCallback(() => {
    undoStackRef.current.push(getSnapshot())
    if (undoStackRef.current.length > 50) {
      undoStackRef.current.shift()
    }
  }, [getSnapshot])

  const applyChange = useCallback(
    async (next: TranscriptSnapshot) => {
      pushUndoSnapshot()
      await saveContent(next)
    },
    [pushUndoSnapshot, saveContent],
  )

  const speakerColorMap = useMemo(() => {
    const map = new Map<string, string>()
    speakers.forEach((speaker, index) => {
      map.set(speaker, SPEAKER_COLORS[index % SPEAKER_COLORS.length])
    })
    return map
  }, [speakers])

  const segmentGroups = useMemo(
    () => groupWordsBySegments(displaySegments, displayWords),
    [displaySegments, displayWords],
  )

  const activeWordIndex = useMemo(
    () => findActiveWordIndex(displayWords, currentTime),
    [displayWords, currentTime],
  )

  const activeSegmentIndex = useMemo(() => {
    if (!displaySegments.length) return -1
    const byTime = findActiveSegmentIndex(displaySegments, currentTime)
    if (byTime >= 0) return byTime
    if (activeWordIndex < 0) return -1
    return segmentGroups.findIndex((group) => group.wordIndices.includes(activeWordIndex))
  }, [displaySegments, currentTime, activeWordIndex, segmentGroups])

  useEffect(() => {
    if (editingIndex != null) return
    activeSegmentRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activeSegmentIndex, editingIndex])

  const setRangeSelection = (anchor: number, target: number) => {
    const left = Math.min(anchor, target)
    const right = Math.max(anchor, target)
    setSelectedIndices(Array.from({ length: right - left + 1 }, (_, index) => left + index))
  }

  const setSegmentRangeSelection = (anchor: number, target: number) => {
    const left = Math.min(anchor, target)
    const right = Math.max(anchor, target)
    setSelectedSegmentIndices(
      Array.from({ length: right - left + 1 }, (_, index) => left + index),
    )
  }

  const clearWordSelectionState = () => {
    setSelectedIndices([])
    setContextMenu(null)
  }

  const clearSegmentSelectionState = () => {
    setSelectedSegmentIndices([])
  }

  const clearSelection = () => {
    clearWordSelectionState()
    clearSegmentSelectionState()
  }

  const handleWordClick = (index: number, event: MouseEvent<HTMLButtonElement>) => {
    if (!onSaveContent) {
      if (canSeek) onSeek(displayWords[index].start)
      return
    }

    if (didDragRef.current) {
      didDragRef.current = false
      return
    }

    if (event.detail > 1) return

    if (shouldSelectOnClick(event, isCoarsePointer)) {
      clearSegmentSelectionState()
      setSelectedIndices((prev) => {
        if (prev.includes(index)) return prev.filter((value) => value !== index)
        return [...prev, index].sort((a, b) => a - b)
      })
      return
    }

    if (canSeek) {
      onSeek(displayWords[index].start)
    }
  }

  const handlePointerDown = (index: number, event: PointerEvent<HTMLButtonElement>) => {
    if (!onSaveContent) return
    didDragRef.current = false
    dragAnchorRef.current = index
    dragSelectEnabledRef.current = shouldSelectOnPointerDown(event, isCoarsePointer)
  }

  const handlePointerEnter = (index: number) => {
    if (!onSaveContent || dragAnchorRef.current < 0 || !dragSelectEnabledRef.current) return
    if (index !== dragAnchorRef.current) {
      didDragRef.current = true
      clearSegmentSelectionState()
      setRangeSelection(dragAnchorRef.current, index)
    }
  }

  const handlePointerUp = () => {
    dragAnchorRef.current = -1
    dragSelectEnabledRef.current = false
  }

  const handleSegmentHeaderClick = (
    segmentIndex: number,
    event: MouseEvent<HTMLDivElement>,
  ) => {
    if (!onSaveContent) {
      if (canSeek) onSeek(displaySegments[segmentIndex]?.start)
      return
    }

    if (segmentDidDragRef.current) {
      segmentDidDragRef.current = false
      return
    }

    if (shouldSelectOnClick(event, isCoarsePointer)) {
      clearWordSelectionState()
      setSelectedSegmentIndices((prev) => {
        if (prev.includes(segmentIndex)) return prev.filter((value) => value !== segmentIndex)
        return [...prev, segmentIndex].sort((a, b) => a - b)
      })
      return
    }

    if (canSeek) {
      onSeek(displaySegments[segmentIndex]?.start)
    }
  }

  const handleSegmentPointerDown = (
    segmentIndex: number,
    event: PointerEvent<HTMLDivElement>,
  ) => {
    if (!onSaveContent) return
    segmentDidDragRef.current = false
    segmentDragAnchorRef.current = segmentIndex
    segmentDragSelectEnabledRef.current = shouldSelectOnPointerDown(event, isCoarsePointer)
  }

  const handleSegmentPointerEnter = (segmentIndex: number) => {
    if (
      !onSaveContent ||
      segmentDragAnchorRef.current < 0 ||
      !segmentDragSelectEnabledRef.current
    ) {
      return
    }

    if (segmentIndex !== segmentDragAnchorRef.current) {
      segmentDidDragRef.current = true
      clearWordSelectionState()
      setSegmentRangeSelection(segmentDragAnchorRef.current, segmentIndex)
    }
  }

  const handleSegmentPointerUp = () => {
    segmentDragAnchorRef.current = -1
    segmentDragSelectEnabledRef.current = false
  }

  const handleContextMenu = (index: number, event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()

    if (!selectedIndices.includes(index)) {
      clearSegmentSelectionState()
      setSelectedIndices([index])
    }

    setContextMenu({ x: event.clientX, y: event.clientY, wordIndex: index })
  }

  const canMergeWords = canMergeSelectedIndices(selectedIndices)
  const canMergeSegments = canMergeSelectedSegmentIndices(selectedSegmentIndices)
  const canSplit = canSplitSelectedIndices(displayWords, selectedIndices)

  const handleUndo = useCallback(async () => {
    if (!onSaveContent) return

    const previous = undoStackRef.current.pop()
    if (!previous) return

    clearSelection()
    setEditingIndex(null)

    try {
      await saveContent(previous)
    } catch {
      undoStackRef.current.push(previous)
    }
  }, [onSaveContent, saveContent])

  const handleMergeWords = useCallback(async () => {
    if (!canMergeWords || !onSaveContent) return

    const mergedText = selectedIndices
      .map((index) => displayWords[index]?.word ?? '')
      .filter(Boolean)
      .join(' ')
    const { words: nextWords, segments: nextSegments } = applyWordMergeWithSegments(
      displaySegments,
      displayWords,
      selectedIndices,
    )
    clearSelection()

    try {
      await applyChange({ words: nextWords, segments: nextSegments })
      toast.success('단어를 합쳤습니다.', { description: mergedText })
    } catch {
      // reverted in saveContent
    }
  }, [
    applyChange,
    canMergeWords,
    displaySegments,
    displayWords,
    onSaveContent,
    selectedIndices,
  ])

  const handleMergeSegments = useCallback(async () => {
    if (!canMergeSegments || !onSaveContent) return

    const mergedText = selectedSegmentIndices
      .map((index) => displaySegments[index]?.text?.trim() ?? '')
      .filter(Boolean)
      .join(' ')
    const { words: nextWords, segments: nextSegments } = mergeSelectedSegments(
      displaySegments,
      displayWords,
      selectedSegmentIndices,
    )
    clearSelection()

    try {
      await applyChange({ words: nextWords, segments: nextSegments })
      toast.success('문장을 합쳤습니다.', { description: mergedText })
    } catch {
      // reverted in saveContent
    }
  }, [
    applyChange,
    canMergeSegments,
    displaySegments,
    displayWords,
    onSaveContent,
    selectedSegmentIndices,
  ])

  const handleSplit = useCallback(async () => {
    if (!canSplit || !onSaveContent) return

    const splitDescription = selectedIndices
      .flatMap((index) => displayWords[index]?.word.trim().split(/\s+/).filter(Boolean) ?? [])
      .join(' | ')
    const nextWords =
      selectedIndices.length === 1
        ? splitWordAtIndex(displayWords, selectedIndices[0])
        : splitWordsAtIndices(displayWords, selectedIndices)
    const nextSegments = applyWordSplitWithSegments(displaySegments, displayWords, nextWords)

    clearSelection()

    try {
      await applyChange({ words: nextWords, segments: nextSegments })
      toast.success('단어를 나눴습니다.', { description: splitDescription })
    } catch {
      // reverted in saveContent
    }
  }, [applyChange, canSplit, displaySegments, displayWords, onSaveContent, selectedIndices])

  useEffect(() => {
    if (!onSaveContent) return

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      if (event.code === 'KeyM' && (event.ctrlKey || event.metaKey) && event.shiftKey) {
        if (!canSplit) return
        event.preventDefault()
        void handleSplit()
        return
      }

      if (event.code === 'KeyM' && (event.ctrlKey || event.metaKey) && !event.shiftKey) {
        if (!canMergeWords) return
        event.preventDefault()
        void handleMergeWords()
        return
      }

      if (event.code === 'KeyZ' && (event.ctrlKey || event.metaKey) && !event.shiftKey) {
        event.preventDefault()
        void handleUndo()
      }
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [canMergeWords, canSplit, handleMergeWords, handleSplit, handleUndo, onSaveContent])

  const startEdit = (index: number) => {
    if (!onSaveContent) return
    clearSelection()
    setEditingIndex(index)
    setDraft(displayWords[index]?.word ?? '')
  }

  const commitEdit = async () => {
    if (editingIndex == null || !onSaveContent) return

    const trimmed = draft.trim()
    if (!trimmed) {
      setEditingIndex(null)
      return
    }

    let nextWords = displayWords.map((word, index) =>
      index === editingIndex ? { ...word, word: trimmed } : word,
    )

    if (/\s/.test(trimmed)) {
      nextWords = splitWordAtIndex(nextWords, editingIndex)
    }

    const nextSegments = syncSegmentTextsFromWords(displaySegments, nextWords)
    setEditingIndex(null)

    try {
      await applyChange({ words: nextWords, segments: nextSegments })
    } catch {
      // reverted in saveContent
    }
  }

  const mergePreview = canMergeWords
    ? selectedIndices
        .map((index) => displayWords[index]?.word ?? '')
        .filter(Boolean)
        .join(' ')
    : null

  const segmentMergePreview = canMergeSegments
    ? selectedSegmentIndices
        .map((index) => displaySegments[index]?.text?.trim() ?? '')
        .filter(Boolean)
        .join(' ')
    : null

  const splitPreview = canSplit
    ? selectedIndices
        .flatMap((index) => displayWords[index]?.word.trim().split(/\s+/).filter(Boolean) ?? [])
        .join(' | ')
    : null

  const editorHint = onSaveContent
    ? 'Ctrl+클릭·Ctrl+드래그로 단어/문장 선택(모바일은 탭·드래그) → 단어 합치기(Ctrl+M) / 문장 합치기 / 나누기(Ctrl+Shift+M). 클릭 시 재생 이동.'
    : '단어를 클릭하면 해당 시점으로 이동합니다. 마우스를 올리면 상세 정보가 표시됩니다.'

  const renderActionBar = () => {
    if (!onSaveContent || (selectedIndices.length === 0 && selectedSegmentIndices.length === 0)) {
      return null
    }

    return (
      <WordActionBar
        canMergeWords={canMergeWords}
        canMergeSegments={canMergeSegments}
        canSplit={canSplit}
        mergePreview={mergePreview}
        segmentMergePreview={segmentMergePreview}
        splitPreview={splitPreview}
        onMergeWords={() => void handleMergeWords()}
        onMergeSegments={() => void handleMergeSegments()}
        onSplit={() => void handleSplit()}
        onClearSelection={clearSelection}
      />
    )
  }

  const renderContextMenu = () => {
    if (!contextMenu || !onSaveContent) return null

    const word = displayWords[contextMenu.wordIndex]

    return (
      <WordContextMenu
        menu={contextMenu}
        canMerge={canMergeWords}
        canSplit={canSplit}
        canSeek={canSeek}
        hasSelection={selectedIndices.length > 0}
        mergePreview={mergePreview}
        splitPreview={splitPreview}
        onMerge={() => void handleMergeWords()}
        onSplit={() => void handleSplit()}
        onSeek={() => onSeek(word?.start)}
        onClearSelection={clearSelection}
        onClose={() => setContextMenu(null)}
      />
    )
  }

  const renderWord = (wordIndex: number) => {
    const word = displayWords[wordIndex]
    if (!word) return null

    return (
      <WordChip
        key={`word-${word.id}-${wordIndex}`}
        word={word}
        wordIndex={wordIndex}
        speakers={speakers}
        isActive={wordIndex === activeWordIndex}
        isSelected={selectedIndices.includes(wordIndex)}
        isEditing={editingIndex === wordIndex}
        draft={draft}
        canSeek={canSeek}
        canEdit={!!onSaveContent}
        onDraftChange={setDraft}
        onCommit={() => void commitEdit()}
        onCancel={() => setEditingIndex(null)}
        onStartEdit={() => startEdit(wordIndex)}
        onClick={(event) => handleWordClick(wordIndex, event)}
        onContextMenu={(event) => handleContextMenu(wordIndex, event)}
        onPointerDown={(event) => handlePointerDown(wordIndex, event)}
        onPointerEnter={() => handlePointerEnter(wordIndex)}
        onPointerUp={handlePointerUp}
      />
    )
  }

  if (segmentGroups.length > 0) {
    return (
      <div>
        {renderContextMenu()}
        {renderActionBar()}
        <p className="mb-3 text-xs text-black/45 dark:text-white/45">
          {editorHint}
          {isSaving ? ' 저장 중...' : ''}
        </p>
        <div className="space-y-3">
          {segmentGroups.map((group) => {
            const { segment, segmentIndex, wordIndices } = group
            const speakerIndex = speakers.indexOf(segment.speaker ?? '') ?? segmentIndex
            const speakerLabel = formatSpeakerLabel(segment.speaker, speakerIndex)
            const speakerColor = getSpeakerColor(segment.speaker, speakerColorMap, speakerIndex)
            const isActive = segmentIndex === activeSegmentIndex
            const isSegmentSelected = selectedSegmentIndices.includes(segmentIndex)
            const hasWords = wordIndices.length > 0

            return (
              <div
                key={`${segment.start ?? segmentIndex}-${segmentIndex}`}
                ref={isActive ? activeSegmentRef : undefined}
                className={`overflow-visible rounded-md border px-4 py-3 transition-colors ${
                  isSegmentSelected
                    ? 'border-black/50 ring-2 ring-black/15 dark:border-white/50 dark:ring-white/15'
                    : isActive
                      ? 'border-black/30 bg-black/3 dark:border-white/30 dark:bg-white/4'
                      : 'border-black/10 dark:border-white/10'
                }`}
              >
                <div
                  className={`mb-2 flex items-center gap-2 text-xs ${
                    onSaveContent ? 'cursor-pointer select-none' : ''
                  }`}
                  onClick={(event) => handleSegmentHeaderClick(segmentIndex, event)}
                  onPointerDown={(event) => handleSegmentPointerDown(segmentIndex, event)}
                  onPointerEnter={() => handleSegmentPointerEnter(segmentIndex)}
                  onPointerUp={handleSegmentPointerUp}
                >
                  <span
                    className={`font-mono transition-colors ${
                      canSeek
                        ? 'text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white'
                        : 'text-black/40 dark:text-white/40'
                    }`}
                  >
                    {formatTimestamp(segment.start)}
                    {segment.end != null && (
                      <span className="text-black/30 dark:text-white/30">
                        {' '}
                        – {formatTimestamp(segment.end)}
                      </span>
                    )}
                  </span>
                  <span className={`font-medium ${speakerColor}`}>{speakerLabel}</span>
                  {isSegmentSelected && (
                    <span className="rounded bg-black/10 px-1.5 py-0.5 text-[10px] font-medium text-black/60 dark:bg-white/10 dark:text-white/60">
                      문장 선택
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 text-sm leading-relaxed text-black dark:text-white">
                  {hasWords
                    ? wordIndices.map((wordIndex) => (
                        <span key={`segment-word-${wordIndex}`} className="inline-flex max-w-full">
                          {renderWord(wordIndex)}
                        </span>
                      ))
                    : segment.text}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (displayWords.length > 0) {
    return (
      <div>
        {renderContextMenu()}
        {renderActionBar()}
        <p className="mb-3 text-xs text-black/45 dark:text-white/45">
          {editorHint}
          {isSaving ? ' 저장 중...' : ''}
        </p>
        <div className="flex flex-wrap gap-1.5 text-sm leading-relaxed text-black dark:text-white">
          {displayWords.map((word, index) => (
            <span key={`${word.id}-${index}`} className="inline-flex max-w-full">
              {renderWord(index)}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return null
}

export default MemoTranscriptEditor

