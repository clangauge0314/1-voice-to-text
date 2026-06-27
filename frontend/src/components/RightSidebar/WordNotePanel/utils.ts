import type { MemoWord } from '../../../stores/memoStore'

export function getDefaultOpenIndices(words: MemoWord[]) {
  const hasAnyNote = words.some((word) => Boolean(word.note?.trim()))
  if (!hasAnyNote) return new Set<number>()

  const open = new Set<number>()
  words.forEach((word, index) => {
    if (word.note?.trim()) open.add(index)
  })
  return open
}

export function getScrollOffset(container: HTMLElement, element: HTMLElement) {
  const containerRect = container.getBoundingClientRect()
  const elementRect = element.getBoundingClientRect()
  return container.scrollTop + (elementRect.top - containerRect.top)
}
