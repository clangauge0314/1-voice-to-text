import type { MemoWord } from '../../../stores/memoStore'
import { formatPreciseTimestamp, formatSpeakerLabel } from '../../../utils/transcriptToMemo'
import EditableWordLabel from './EditableWordLabel'
import PlaybackTextarea from './PlaybackTextarea'

interface LyricsModeViewProps {
  memoId: string
  activeWordIndex: number
  activeWord: MemoWord
  speakers: string[]
}

const LyricsModeView = ({
  memoId,
  activeWordIndex,
  activeWord,
  speakers,
}: LyricsModeViewProps) => {
  const speakerIndex = speakers.indexOf(activeWord.speaker ?? '')
  const speakerLabel = formatSpeakerLabel(
    activeWord.speaker,
    speakerIndex >= 0 ? speakerIndex : 0,
  )
  const timeLabel =
    activeWord.start != null || activeWord.end != null
      ? `${formatPreciseTimestamp(activeWord.start)} – ${formatPreciseTimestamp(activeWord.end)}`
      : null
  const metaParts = [`#${activeWordIndex + 1}`, speakerLabel, timeLabel].filter(Boolean)

  return (
    <div className="flex flex-col p-3">
      <div className="flex flex-col rounded-xl border border-black/[0.12] bg-black/[0.06] shadow-sm dark:border-white/[0.12] dark:bg-white/[0.06]">
        <div className="flex-none px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex rounded bg-black/10 px-1.5 py-0.5 text-[10px] font-bold text-black/60 dark:bg-white/10 dark:text-white/60">
              재생 중
            </span>
          </div>
          <EditableWordLabel
            memoId={memoId}
            wordIndex={activeWordIndex}
            word={activeWord}
            className="mt-3 block text-xl font-bold text-black dark:text-white"
          />
          <p className="mt-1 break-words text-xs text-black/45 dark:text-white/45">
            {metaParts.join(' · ')}
          </p>
        </div>
        <div className="px-3 pb-3">
          <PlaybackTextarea
            key={activeWordIndex}
            memoId={memoId}
            wordIndex={activeWordIndex}
            word={activeWord}
          />
        </div>
      </div>
    </div>
  )
}

export default LyricsModeView
