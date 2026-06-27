import { useCallback, useEffect, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import type { MemoWord } from '../../stores/memoStore'
import { formatPreciseTimestamp, formatSpeakerLabel } from '../../utils/transcriptToMemo'

interface WordDetailTooltipProps {
  word: MemoWord
  speakers: string[]
  anchorRef: RefObject<HTMLElement | null>
  visible: boolean
}

const WordDetailTooltip = ({ word, speakers, anchorRef, visible }: WordDetailTooltipProps) => {
  const [position, setPosition] = useState({ top: 0, left: 0 })

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current
    if (!anchor) return

    const rect = anchor.getBoundingClientRect()
    setPosition({
      top: rect.top - 8,
      left: rect.left + rect.width / 2,
    })
  }, [anchorRef])

  useEffect(() => {
    if (!visible) return

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [visible, updatePosition])

  const speakerIndex = speakers.indexOf(word.speaker ?? '')
  const speakerLabel = formatSpeakerLabel(
    word.speaker,
    speakerIndex >= 0 ? speakerIndex : 0,
  )
  const duration =
    word.start != null && word.end != null
      ? Math.max(0, word.end - word.start)
      : null

  const rows = [
    { label: '단어', value: word.word },
    {
      label: '시간',
      value:
        word.start != null || word.end != null
          ? `${formatPreciseTimestamp(word.start)} – ${formatPreciseTimestamp(word.end)}`
          : '-',
      mono: true,
    },
    {
      label: '길이',
      value: duration != null ? `${duration.toFixed(2)}초` : '-',
      mono: true,
    },
    { label: '화자', value: speakerLabel },
    { label: 'ID', value: String(word.id), mono: true },
  ]

  if (!visible) return null

  return createPortal(
    <div
      className="pointer-events-none fixed z-9999 w-52 -translate-x-1/2 -translate-y-full rounded-lg border border-black/10 bg-white p-3 text-left shadow-lg dark:border-white/15 dark:bg-neutral-950"
      style={{ top: position.top, left: position.left }}
      role="tooltip"
    >
      <p className="mb-2 break-words border-b border-black/8 pb-2 text-sm font-semibold [overflow-wrap:anywhere] text-black dark:border-white/10 dark:text-white">
        {word.word}
      </p>
      <dl className="space-y-1.5">
        {rows.slice(1).map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-3 text-xs">
            <dt className="shrink-0 text-black/45 dark:text-white/45">{row.label}</dt>
            <dd
              className={`text-right text-black dark:text-white ${
                row.mono ? 'font-mono' : ''
              }`}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>,
    document.body,
  )
}

export default WordDetailTooltip
