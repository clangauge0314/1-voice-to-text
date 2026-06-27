import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getMemoById, useMemoStore, type MemoWord } from '../../../stores/memoStore'
import { splitWordAtIndex } from '../../../utils/transcriptToMemo'

interface EditableWordLabelProps {
  memoId: string
  wordIndex: number
  word: MemoWord
  className?: string
}

const EditableWordLabel = ({
  memoId,
  wordIndex,
  word,
  className = '',
}: EditableWordLabelProps) => {
  const memos = useMemoStore((state) => state.memos)
  const saveMemoWords = useMemoStore((state) => state.saveMemoWords)
  const [isEditing, setIsEditing] = useState(false)
  const [wordDraft, setWordDraft] = useState(word.word)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isEditing) {
      setWordDraft(word.word)
    }
  }, [word.word, isEditing])

  const commitWordEdit = async () => {
    const trimmed = wordDraft.trim()
    setIsEditing(false)

    if (!trimmed || trimmed === word.word.trim()) {
      setWordDraft(word.word)
      return
    }

    const memo = getMemoById(memoId, memos)
    const words = memo?.words
    if (!words || wordIndex < 0 || wordIndex >= words.length) return

    let nextWords = words.map((entry, index) =>
      index === wordIndex ? { ...entry, word: trimmed } : entry,
    )

    if (/\s/.test(trimmed)) {
      nextWords = splitWordAtIndex(nextWords, wordIndex)
    }

    setIsSaving(true)
    try {
      await saveMemoWords(memoId, nextWords)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '단어 수정에 실패했습니다.')
      setWordDraft(word.word)
    } finally {
      setIsSaving(false)
    }
  }

  if (isEditing) {
    return (
      <input
        value={wordDraft}
        onChange={(event) => setWordDraft(event.target.value)}
        onBlur={() => void commitWordEdit()}
        onKeyDown={(event) => {
          if (event.key === 'Enter') void commitWordEdit()
          if (event.key === 'Escape') {
            setWordDraft(word.word)
            setIsEditing(false)
          }
        }}
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        className={`w-full rounded border border-black/30 bg-white px-2 py-1 text-sm font-semibold text-black outline-none focus:border-black dark:border-white/30 dark:bg-black dark:text-white dark:focus:border-white ${className}`}
        autoFocus
      />
    )
  }

  return (
    <span
      onDoubleClick={(event) => {
        event.stopPropagation()
        setWordDraft(word.word)
        setIsEditing(true)
      }}
      className={`break-words [overflow-wrap:anywhere] ${className} ${
        isSaving ? 'opacity-60' : 'cursor-text'
      }`}
      title="더블클릭하여 단어 수정"
    >
      {word.word}
    </span>
  )
}

export default EditableWordLabel
