import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useMemoStore } from '../stores/memoStore'

const NOTE_SAVE_DELAY_MS = 600

export function useWordNoteDraft(memoId: string, wordIndex: number, savedNote?: string) {
  const saveWordNote = useMemoStore((state) => state.saveWordNote)
  const [draft, setDraft] = useState(savedNote ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [pendingAiNote, setPendingAiNote] = useState<string | null>(null)
  const saveTimerRef = useRef<number | null>(null)
  const lastSavedRef = useRef(savedNote ?? '')

  const isDirty = draft.trim() !== lastSavedRef.current.trim()

  useEffect(() => {
    if (isDirty) return
    const nextNote = savedNote ?? ''
    setDraft(nextNote)
    lastSavedRef.current = nextNote
  }, [savedNote, wordIndex, isDirty])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current != null) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  const flushSave = useCallback(
    async (value: string) => {
      if (value.trim() === lastSavedRef.current.trim()) return

      setIsSaving(true)
      try {
        await saveWordNote(memoId, wordIndex, value)
        lastSavedRef.current = value.trim()
        setPendingAiNote(null)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : '단어 메모 저장에 실패했습니다.')
      } finally {
        setIsSaving(false)
      }
    },
    [memoId, saveWordNote, wordIndex],
  )

  const scheduleSave = useCallback(
    (value: string) => {
      if (saveTimerRef.current != null) {
        window.clearTimeout(saveTimerRef.current)
      }

      saveTimerRef.current = window.setTimeout(() => {
        void flushSave(value)
      }, NOTE_SAVE_DELAY_MS)
    },
    [flushSave],
  )

  const handleChange = useCallback(
    (value: string) => {
      setDraft(value)
      scheduleSave(value)
    },
    [scheduleSave],
  )

  const handleBlur = useCallback(() => {
    if (saveTimerRef.current != null) {
      window.clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    void flushSave(draft)
  }, [draft, flushSave])

  const handleAiGenerated = useCallback(
    (note: string) => {
      const dirty = draft.trim() !== lastSavedRef.current.trim()
      if (dirty) {
        setPendingAiNote(note)
        toast.info('AI 메모를 제안했습니다. 적용하거나 유지할 수 있습니다.')
        return
      }

      setDraft(note)
      lastSavedRef.current = note.trim()
      setPendingAiNote(null)
      toast.success('AI 메모가 작성되었습니다.')
    },
    [draft],
  )

  const applyPendingAiNote = useCallback(() => {
    if (!pendingAiNote) return
    setDraft(pendingAiNote)
    void flushSave(pendingAiNote)
  }, [pendingAiNote, flushSave])

  const dismissPendingAiNote = useCallback(() => {
    setPendingAiNote(null)
    toast.message('작성 중인 메모를 유지했습니다.')
  }, [])

  return {
    draft,
    isSaving,
    isDirty,
    pendingAiNote,
    lastSavedRef,
    handleChange,
    handleBlur,
    handleAiGenerated,
    applyPendingAiNote,
    dismissPendingAiNote,
  }
}
