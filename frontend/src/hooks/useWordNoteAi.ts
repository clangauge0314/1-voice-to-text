import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { useMemoStore } from '../stores/memoStore'

interface UseWordNoteAiOptions {
  currentNote?: string
  onAiGenerated?: (note: string) => void
}

export function useWordNoteAi(
  memoId: string,
  wordIndex: number,
  options: UseWordNoteAiOptions = {},
) {
  const { currentNote, onAiGenerated } = options
  const generateWordAiNote = useMemoStore((state) => state.generateWordAiNote)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = useCallback(async () => {
    if (isGenerating) return
    if (currentNote?.trim()) {
      const ok = window.confirm(
        '이미 메모가 있습니다. AI 메모를 다시 생성하면 기존 내용을 덮어씁니다. 계속할까요?',
      )
      if (!ok) return
    }

    setIsGenerating(true)
    try {
      const note = await generateWordAiNote(memoId, wordIndex)
      onAiGenerated?.(note)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'AI 메모 생성에 실패했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }, [generateWordAiNote, isGenerating, memoId, wordIndex, currentNote, onAiGenerated])

  return { isGenerating, handleGenerate }
}
