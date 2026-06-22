import { useEffect, useMemo, useRef, useState } from 'react'
import type { MemoWord } from '../../stores/memoStore'
import {
  formatSpeakerLabel,
  getSpeakerColor,
  findActiveWordIndex,
  SPEAKER_COLORS,
} from '../../utils/transcriptToMemo'

interface WordMemoEditorProps {
  words: MemoWord[]
  speakers: string[]
  currentTime: number
  canSeek: boolean
  onSeek: (time?: number) => void
  onSaveWords: (words: MemoWord[]) => Promise<void>
}

const WordMemoEditor = ({
  words,
  speakers,
  currentTime,
  canSeek,
  onSeek,
  onSaveWords,
}: WordMemoEditorProps) => {
  const [localWords, setLocalWords] = useState(words)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const activeWordRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    setLocalWords(words)
  }, [words])

  const speakerColorMap = useMemo(() => {
    const map = new Map<string, string>()
    speakers.forEach((speaker, index) => {
      map.set(speaker, SPEAKER_COLORS[index % SPEAKER_COLORS.length])
    })
    return map
  }, [speakers])

  const activeWordIndex = useMemo(
    () => findActiveWordIndex(localWords, currentTime),
    [localWords, currentTime],
  )

  useEffect(() => {
    if (editingIndex != null) return
    activeWordRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activeWordIndex, editingIndex])

  const persistWords = async (nextWords: MemoWord[]) => {
    setIsSaving(true)
    try {
      await onSaveWords(nextWords)
    } finally {
      setIsSaving(false)
    }
  }

  const startEdit = (index: number) => {
    setEditingIndex(index)
    setDraft(localWords[index]?.word ?? '')
  }

  const cancelEdit = () => {
    setEditingIndex(null)
    setDraft('')
  }

  const commitEdit = async () => {
    if (editingIndex == null) return

    const trimmed = draft.trim()
    if (!trimmed) {
      cancelEdit()
      return
    }

    const nextWords = localWords.map((word, index) =>
      index === editingIndex ? { ...word, word: trimmed } : word,
    )

    setLocalWords(nextWords)
    cancelEdit()
    await persistWords(nextWords)
  }

  return (
    <div>
      <p className="mb-3 text-xs text-black/45 dark:text-white/45">
        단어를 클릭하면 해당 시점으로 이동하고, 더블클릭하면 수정할 수 있습니다.
        {isSaving ? ' 저장 중...' : ''}
      </p>
      <p className="text-sm leading-8 text-black dark:text-white">
        {localWords.map((word, index) => {
          const showSpeaker =
            index === 0 || localWords[index - 1]?.speaker !== word.speaker
          const speakerIndex = speakers.indexOf(word.speaker ?? '') ?? index
          const speakerLabel = formatSpeakerLabel(word.speaker, speakerIndex)
          const speakerColor = getSpeakerColor(word.speaker, speakerColorMap, speakerIndex)
          const isActive = index === activeWordIndex
          const isEditing = editingIndex === index

          return (
            <span key={`${word.id}-${index}`} className="inline">
              {showSpeaker && (
                <span
                  className={`mr-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${speakerColor} bg-black/[0.04] dark:bg-white/[0.06]`}
                >
                  {speakerLabel}
                </span>
              )}
              {isEditing ? (
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onBlur={() => void commitEdit()}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void commitEdit()
                    if (event.key === 'Escape') cancelEdit()
                  }}
                  className="mx-0.5 inline w-24 rounded border border-black/25 bg-transparent px-1 py-0.5 text-sm text-black outline-none focus:border-black dark:border-white/25 dark:text-white dark:focus:border-white"
                  autoFocus
                />
              ) : (
                <button
                  type="button"
                  ref={isActive ? activeWordRef : undefined}
                  onClick={() => {
                    if (canSeek) onSeek(word.start)
                  }}
                  onDoubleClick={() => startEdit(index)}
                  className={`mx-0.5 inline rounded px-0.5 transition-colors ${
                    isActive
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'hover:bg-black/8 dark:hover:bg-white/10'
                  } ${canSeek ? 'cursor-pointer' : 'cursor-text'}`}
                >
                  {word.word}
                </button>
              )}
              {' '}
            </span>
          )
        })}
      </p>
    </div>
  )
}

export default WordMemoEditor
