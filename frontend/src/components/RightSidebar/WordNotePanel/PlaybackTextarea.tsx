import { useWordNoteDraft } from '../../../hooks/useWordNoteDraft'
import type { MemoWord } from '../../../stores/memoStore'
import WordNoteMemoField from './WordNoteMemoField'

interface PlaybackTextareaProps {
  memoId: string
  wordIndex: number
  word: MemoWord
}

const PlaybackTextarea = ({ memoId, wordIndex, word }: PlaybackTextareaProps) => {
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

  return (
    <WordNoteMemoField
      memoId={memoId}
      wordIndex={wordIndex}
      word={word.word}
      value={draft}
      onChange={handleChange}
      onBlur={handleBlur}
      rows={4}
      isSaving={isSaving}
      className="h-full"
      textareaClassName="min-h-[7rem] flex-1 resize-none"
      pendingAiNote={pendingAiNote}
      onAiGenerated={handleAiGenerated}
      onApplyAiNote={applyPendingAiNote}
      onDismissAiNote={dismissPendingAiNote}
    />
  )
}

export default PlaybackTextarea
