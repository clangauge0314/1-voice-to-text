import type { MemoWord } from '../../../stores/memoStore'

export interface WordNoteEditorRenderProps {
  word: MemoWord
  index: number
  speakerLabel: string
  isOpen: boolean
  isHighlighted: boolean
  isActive: boolean
  onToggle: () => void
  editorRef: (element: HTMLElement | null) => void
}
