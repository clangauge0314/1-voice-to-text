import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { useMemoStore } from '../stores/memoStore'

export function useWordNoteAi(memoId: string, wordIndex: number, word: string) {
  const generateWordAiNote = useMemoStore((state) => state.generateWordAiNote)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = useCallback(async () => {
    if (isGenerating) return

    setIsGenerating(true)
    try {
      await generateWordAiNote(memoId, wordIndex)
      toast.success('AI 메모가 작성되었습니다.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'AI 메모 생성에 실패했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }, [generateWordAiNote, isGenerating, memoId, word, wordIndex])

  return { isGenerating, handleGenerate }
}
