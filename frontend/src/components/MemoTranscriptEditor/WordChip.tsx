import { useRef, useState, type MouseEvent, type PointerEvent } from 'react'
import type { MemoWord } from '../../stores/memoStore'
import WordDetailTooltip from './WordDetailTooltip'

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

export default WordChip
