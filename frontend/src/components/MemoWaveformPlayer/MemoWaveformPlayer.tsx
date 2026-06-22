import { Loader2, Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import WaveSurfer from 'wavesurfer.js'
import type { Theme } from '../../stores/themeStore'
import { formatTimestamp } from '../../utils/transcriptToMemo'
import '../../styles/memoWaveformPlayer.css'

interface MemoWaveformPlayerProps {
  audioUrl: string
  title: string
  theme: Theme
  onTimeUpdate: (currentTime: number) => void
  seekRef: MutableRefObject<((time: number) => void) | null>
}

function getWaveColors(theme: Theme) {
  if (theme === 'dark') {
    return {
      waveColor: 'rgba(255, 255, 255, 0.18)',
      progressColor: '#ffffff',
      cursorColor: '#ffffff',
    }
  }

  return {
    waveColor: 'rgba(0, 0, 0, 0.12)',
    progressColor: '#000000',
    cursorColor: '#000000',
  }
}

const MemoWaveformPlayer = ({
  audioUrl,
  title,
  theme,
  onTimeUpdate,
  seekRef,
}: MemoWaveformPlayerProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const waveSurferRef = useRef<WaveSurfer | null>(null)
  const onTimeUpdateRef = useRef(onTimeUpdate)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate
  }, [onTimeUpdate])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let cancelled = false
    const colors = getWaveColors(theme)

    const waveSurfer = WaveSurfer.create({
      container,
      ...colors,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      cursorWidth: 2,
      height: 72,
      normalize: true,
      fillParent: true,
      mediaControls: false,
      dragToSeek: true,
    })

    waveSurferRef.current = waveSurfer

    const syncTime = () => {
      const time = waveSurfer.getCurrentTime()
      setCurrentTime(time)
      onTimeUpdateRef.current(time)
    }

    waveSurfer.on('ready', () => {
      if (cancelled) return
      setIsReady(true)
      setDuration(waveSurfer.getDuration())
      syncTime()
    })

    waveSurfer.on('audioprocess', syncTime)
    waveSurfer.on('timeupdate', syncTime)
    waveSurfer.on('seeking', syncTime)
    waveSurfer.on('play', () => setIsPlaying(true))
    waveSurfer.on('pause', () => setIsPlaying(false))
    waveSurfer.on('finish', () => setIsPlaying(false))

    waveSurfer.load(audioUrl)

    seekRef.current = (time: number) => {
      const total = waveSurfer.getDuration()
      if (!total || time < 0) return
      waveSurfer.seekTo(Math.min(time / total, 1))
      void waveSurfer.play()
    }

    return () => {
      cancelled = true
      seekRef.current = null
      waveSurfer.destroy()
      waveSurferRef.current = null
      setIsReady(false)
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)
    }
  }, [audioUrl, theme, seekRef])

  useEffect(() => {
    const waveSurfer = waveSurferRef.current
    if (!waveSurfer) return
    waveSurfer.setVolume(isMuted ? 0 : volume)
  }, [volume, isMuted])

  const togglePlay = () => {
    const waveSurfer = waveSurferRef.current
    if (!waveSurfer || !isReady) return
    void waveSurfer.playPause()
  }

  const toggleMute = () => {
    setIsMuted((prev) => !prev)
  }

  return (
    <div className="memo-waveform-player-shell rounded-md border border-black/10 p-3 sm:p-4 dark:border-white/10">
      <div className="flex flex-col gap-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={togglePlay}
            disabled={!isReady}
            className="memo-waveform-player__play-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/15 text-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/20 dark:text-white dark:hover:bg-white dark:hover:text-black"
            aria-label={isPlaying ? '일시정지' : '재생'}
          >
            {!isReady ? (
              <Loader2 size={18} className="animate-spin" />
            ) : isPlaying ? (
              <Pause size={18} />
            ) : (
              <Play size={18} className="ml-0.5" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-black dark:text-white">{title}</p>
            <p className="mt-0.5 font-mono text-xs text-black/50 dark:text-white/50">
              {formatTimestamp(currentTime)}
              <span className="mx-1 text-black/30 dark:text-white/30">/</span>
              {formatTimestamp(duration)}
            </p>
          </div>

          <button
            type="button"
            onClick={toggleMute}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-black/70 transition-colors hover:bg-black/5 hover:text-black sm:hidden dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          <div className="memo-waveform-player__volume hidden shrink-0 items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={toggleMute}
              className="flex h-8 w-8 items-center justify-center rounded-md text-black/70 transition-colors hover:bg-black/5 hover:text-black dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label={isMuted ? '음소거 해제' : '음소거'}
            >
              {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(event) => {
                const next = Number(event.target.value)
                setVolume(next)
                if (next > 0) setIsMuted(false)
              }}
              className="memo-waveform-player__volume-slider w-20"
              aria-label="볼륨"
            />
          </div>
        </div>

        <div
          ref={containerRef}
          className="memo-waveform-player__waveform w-full min-h-[72px] overflow-hidden rounded-md"
        />
      </div>

      <p className="mt-2 text-xs text-black/45 dark:text-white/45">
        웨이브폼 또는 단어를 클릭하면 해당 위치로 이동합니다.
      </p>
    </div>
  )
}

export default MemoWaveformPlayer
