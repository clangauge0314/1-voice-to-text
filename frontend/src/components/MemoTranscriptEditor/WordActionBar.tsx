import { Merge, Scissors, X } from 'lucide-react'

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

export default WordActionBar
