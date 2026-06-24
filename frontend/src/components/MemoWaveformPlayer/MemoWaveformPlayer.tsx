import { Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import { toast } from 'sonner'
// @ts-ignore
import WaveformPlayer from '@arraypress/waveform-player'
import '@arraypress/waveform-player/dist/waveform-player.css'
import { useAuthStore } from '../../stores/authStore'
import { useMemoPlaybackStore } from '../../stores/memoPlaybackStore'
import type { Theme } from '../../stores/themeStore'
import { formatTimestamp } from '../../utils/transcriptToMemo'

interface MemoAudioPlayerProps {
  audioUrl: string
  title: string
  theme: Theme
  onTimeUpdate: (currentTime: number) => void
  seekRef: MutableRefObject<((time: number) => void) | null>
}

function buildAuthenticatedAudioUrl(audioUrl: string, token: string) {
  if (!audioUrl) return ''
  // Cloudinary 등 외부 URL인 경우 토큰을 붙이지 않음
  if (audioUrl.startsWith('http')) return audioUrl

  const absoluteUrl = `${window.location.origin}${audioUrl}`
  const separator = absoluteUrl.includes('?') ? '&' : '?'
  return `${absoluteUrl}${separator}token=${encodeURIComponent(token)}`
}

const MemoAudioPlayer = ({
  audioUrl,
  theme,
  onTimeUpdate,
  seekRef,
}: MemoAudioPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerInstanceRef = useRef<any>(null)
  const onTimeUpdateRef = useRef(onTimeUpdate)
  const volumeRef = useRef(1)
  const isMutedRef = useRef(false)

  const token = useAuthStore((state) => state.token)
  const setIsPlaying = useMemoPlaybackStore((state) => state.setIsPlaying)
  const pauseSignal = useMemoPlaybackStore((state) => state.pauseSignal)
  const authenticatedAudioUrl =
    audioUrl && token ? buildAuthenticatedAudioUrl(audioUrl, token) : ''

  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    volumeRef.current = volume
  }, [volume])

  useEffect(() => {
    isMutedRef.current = isMuted
  }, [isMuted])

  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate
  }, [onTimeUpdate])

  useEffect(() => {
    if (pauseSignal === 0) return

    const player = playerInstanceRef.current
    if (!player) return

    if (typeof player.pause === 'function') {
      player.pause()
    } else {
      player.audio?.pause()
    }
  }, [pauseSignal])

  useEffect(() => {
    if (playerInstanceRef.current) {
      playerInstanceRef.current.setVolume(isMuted ? 0 : volume)
    }
  }, [volume, isMuted])

  useEffect(() => {
    if (!containerRef.current || !authenticatedAudioUrl) return

    const waveformColor = 'rgba(0,0,0,0.3)'
    const progressColor = '#000000'

    const player = new WaveformPlayer(containerRef.current, {
      url: authenticatedAudioUrl,
      waveformStyle: 'bars',
      height: 40,
      barWidth: 2,
      barSpacing: 2,
      waveformColor,
      progressColor,
      buttonColor: progressColor,
      showControls: true,
      showInfo: false,
      showTime: false,
      preload: 'auto',
      onLoad: (loadedPlayer: any) => {
        loadedPlayer.setVolume(isMutedRef.current ? 0 : volumeRef.current)
        if (loadedPlayer.audio?.duration) {
          setDuration(loadedPlayer.audio.duration)
        }
      },
      onTimeUpdate: (current: number, total: number) => {
        setCurrentTime(current)
        if (total) setDuration(total)
        onTimeUpdateRef.current(current)
      },
      onPlay: () => setIsPlaying(true),
      onPause: () => setIsPlaying(false),
      onError: () => {
        toast.error('오디오를 재생할 수 없습니다. 새로고침 후 다시 시도해주세요.')
      },
    })

    // Cloudinary 등 외부 도메인일 경우 CORS를 위해 anonymous를 유지해야 할 수 있으나
    // 브라우저에 따라 오디오 재생이 막히는 문제를 방지하기 위해 crossOrigin 속성을 제거합니다.
    if (player.audio) {
      player.audio.removeAttribute('crossorigin')
      player.audio.removeAttribute('crossOrigin')
      player.audio.preload = 'auto'
      
      // DOM에 오디오 요소를 숨김 상태로 추가 (일부 모바일 브라우저의 재생 버그 방지)
      player.audio.style.position = 'absolute'
      player.audio.style.width = '0'
      player.audio.style.height = '0'
      player.audio.style.opacity = '0'
      containerRef.current.appendChild(player.audio)

      player.audio.addEventListener('error', () => {
        console.error('[Audio] Error:', player.audio?.error)
      })
    }

    playerInstanceRef.current = player
    player.setVolume(isMutedRef.current ? 0 : volumeRef.current)

    seekRef.current = (time: number) => {
      const player = playerInstanceRef.current
      if (!player) return

      player.seekTo(time)

      if (typeof player.pause === 'function') {
        player.pause()
      } else {
        player.audio?.pause()
      }

      setIsPlaying(false)
      setCurrentTime(time)
      onTimeUpdateRef.current(time)
    }

    return () => {
      setIsPlaying(false)
      if (playerInstanceRef.current) {
        // null 체크를 포함하여 destroy 시 발생할 수 있는 내부 오류 방지
        try {
          if (playerInstanceRef.current.audio) {
            // 커스텀 리스너 직접 정리
            playerInstanceRef.current.audio.onplay = null
            playerInstanceRef.current.audio.onpause = null
          }
          if (typeof playerInstanceRef.current.destroy === 'function') {
            playerInstanceRef.current.destroy()
          }
        } catch (e) {
          // ignore destroy errors
        }
        playerInstanceRef.current = null
      }
      seekRef.current = null
    }
  }, [authenticatedAudioUrl, seekRef, setIsPlaying])

  if (!authenticatedAudioUrl) {
    return null
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm sm:p-5 dark:border-white/10 dark:bg-neutral-950">
      <style>{`
        .waveform-player {
          background: transparent !important;
          padding: 0 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          width: 100% !important;
        }
        .waveform-body {
          flex-direction: row !important;
          align-items: center !important;
          gap: 1rem !important;
          width: 100% !important;
        }
        .waveform-track {
          flex: 1 !important;
          gap: 1rem !important;
          width: 100% !important;
        }
        .waveform-container {
          flex: 1 !important;
          width: 100% !important;
        }
        .waveform-info {
          display: none !important;
        }
        .waveform-btn {
          width: 40px !important;
          height: 40px !important;
          background: ${theme === 'dark' ? '#ffffff' : '#000000'} !important;
          color: ${theme === 'dark' ? '#000000' : '#ffffff'} !important;
          border-radius: 50% !important;
          border: none !important;
          flex-shrink: 0 !important;
        }
        .waveform-container canvas {
          filter: ${theme === 'dark' ? 'invert(1) hue-rotate(180deg)' : 'none'} !important;
          width: 100% !important;
        }
      `}</style>

      <div className="flex w-full items-center">
        <div ref={containerRef} className="w-full" />
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="font-mono text-xs font-medium text-black/60 dark:text-white/60">
          {formatTimestamp(currentTime)}
          <span className="mx-1 text-black/30 dark:text-white/30">/</span>
          {formatTimestamp(duration)}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-black/60 transition-colors hover:bg-black/5 hover:text-black dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
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
            className="hidden w-20 accent-black sm:block dark:accent-white"
            aria-label="볼륨"
          />
        </div>
      </div>
    </div>
  )
}

export default MemoAudioPlayer
