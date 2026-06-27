export function shouldSelectOnClick(
  event: { ctrlKey: boolean; metaKey: boolean; pointerType?: string },
  isCoarsePointer: boolean,
) {
  if (event.pointerType === 'touch') return true
  if (isCoarsePointer) return true
  return event.ctrlKey || event.metaKey
}

export function shouldSelectOnPointerDown(
  event: { ctrlKey: boolean; metaKey: boolean; pointerType: string },
  isCoarsePointer: boolean,
) {
  if (event.pointerType === 'touch') return true
  if (isCoarsePointer && event.pointerType !== 'mouse') return true
  return event.ctrlKey || event.metaKey
}
