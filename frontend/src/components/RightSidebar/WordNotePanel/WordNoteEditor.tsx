import { ChevronDown, Loader2 } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useWordNoteDraft } from '../../../hooks/useWordNoteDraft'
import type { MemoWord } from '../../../stores/memoStore'
import { formatPreciseTimestamp } from '../../../utils/transcriptToMemo'
import EditableWordLabel from './EditableWordLabel'
import WordNoteMemoField from './WordNoteMemoField'

export interface WordNoteEditorProps {
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
  const {
    draft,
    isSaving,
    pendingAiNote,
    handleChange,
    handleBlur,
    handleAiGenerated,
    applyPendingAiNote,
    dismissPendingAiNote,
  } = useWordNoteDraft(memoId, wordIndex, word.note)

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
      <div className="flex w-full items-start gap-2 p-3">
        <button
          type="button"
          onClick={onToggle}
          className="mt-0.5 shrink-0 text-black/40 transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
          aria-expanded={isOpen}
          aria-label={isOpen ? '접기' : '펼치기'}
        >
          <motion.span
            animate={{ rotate: isOpen ? 0 : -90 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="inline-flex"
          >
            <ChevronDown size={14} />
          </motion.span>
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-2">
            <EditableWordLabel
              memoId={memoId}
              wordIndex={wordIndex}
              word={word}
              className="text-sm font-semibold text-black dark:text-white"
            />
            {hasNote && !isOpen && (
              <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
                메모
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="mt-0.5 block w-full text-left transition-colors hover:opacity-80"
          >
            <span className="block text-[10px] text-black/45 dark:text-white/45">
              {metaParts.join(' · ')}
            </span>
            {!isOpen && hasNote && (
              <span className="mt-1 block whitespace-pre-wrap break-words text-xs text-black/55 [overflow-wrap:anywhere] dark:text-white/55">
                {word.note?.trim()}
              </span>
            )}
          </button>
        </div>
        {isSaving && (
          <span className="flex shrink-0 items-center gap-1 text-[10px] text-black/45 dark:text-white/45">
            <Loader2 size={11} className="animate-spin" />
            저장 중
          </span>
        )}
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="memo-field"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-black/10 dark:border-white/10"
          >
            <div className="px-3 pb-3 pt-2">
              <WordNoteMemoField
                memoId={memoId}
                wordIndex={wordIndex}
                word={word.word}
                value={draft}
                onChange={handleChange}
                onBlur={handleBlur}
                isSaving={isSaving}
                pendingAiNote={pendingAiNote}
                onAiGenerated={handleAiGenerated}
                onApplyAiNote={applyPendingAiNote}
                onDismissAiNote={dismissPendingAiNote}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  )
}

export default WordNoteEditor
