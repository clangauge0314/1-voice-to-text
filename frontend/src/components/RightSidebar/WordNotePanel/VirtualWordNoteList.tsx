import { useVirtualizer } from '@tanstack/react-virtual'
import { forwardRef, useEffect, useImperativeHandle, type RefObject } from 'react'
import type { MemoWord } from '../../../stores/memoStore'
import { formatSpeakerLabel } from '../../../utils/transcriptToMemo'
import type { WordNoteEditorRenderProps } from './types'

export const VIRTUAL_SCROLL_THRESHOLD = 200
const COLLAPSED_ROW_HEIGHT = 56
const OPEN_ROW_HEIGHT = 196
const ROW_GAP = 8

export interface VirtualWordNoteListHandle {
  scrollToIndex: (index: number, behavior: ScrollBehavior) => void
}

interface VirtualWordNoteListProps {
  scrollContainerRef: RefObject<HTMLDivElement | null>
  words: MemoWord[]
  speakers: string[]
  openIndices: Set<number>
  activeWordIndex: number
  selectedIndexSet: Set<number>
  renderEditor: (props: WordNoteEditorRenderProps) => React.ReactNode
  onToggleWord: (index: number) => void
  itemRefs: RefObject<Map<number, HTMLElement>>
}

const VirtualWordNoteList = forwardRef<VirtualWordNoteListHandle, VirtualWordNoteListProps>(
  (
    {
      scrollContainerRef,
      words,
      speakers,
      openIndices,
      activeWordIndex,
      selectedIndexSet,
      renderEditor,
      onToggleWord,
      itemRefs,
    },
    ref,
  ) => {
    const virtualizer = useVirtualizer({
      count: words.length,
      getScrollElement: () => scrollContainerRef.current,
      estimateSize: (index) =>
        openIndices.has(index) ? OPEN_ROW_HEIGHT : COLLAPSED_ROW_HEIGHT,
      gap: ROW_GAP,
      overscan: 6,
    })

    useImperativeHandle(ref, () => ({
      scrollToIndex: (index, behavior) => {
        virtualizer.scrollToIndex(index, { align: 'center', behavior })
      },
    }))

    useEffect(() => {
      virtualizer.measure()
    }, [openIndices, virtualizer])

    return (
      <div
        className="relative w-full py-2"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const index = virtualRow.index
          const word = words[index]
          const speakerIndex = speakers.indexOf(word.speaker ?? '')
          const speakerLabel = formatSpeakerLabel(
            word.speaker,
            speakerIndex >= 0 ? speakerIndex : 0,
          )

          return (
            <div
              key={`virtual-word-${word.id}-${index}`}
              ref={virtualizer.measureElement}
              data-index={index}
              className="absolute left-0 top-0 w-full"
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              {renderEditor({
                word,
                index,
                speakerLabel,
                isOpen: openIndices.has(index),
                isHighlighted: selectedIndexSet.has(index),
                isActive: index === activeWordIndex,
                onToggle: () => onToggleWord(index),
                editorRef: (element) => {
                  if (element) {
                    itemRefs.current?.set(index, element)
                  } else {
                    itemRefs.current?.delete(index)
                  }
                },
              })}
            </div>
          )
        })}
      </div>
    )
  },
)

VirtualWordNoteList.displayName = 'VirtualWordNoteList'

export default VirtualWordNoteList
