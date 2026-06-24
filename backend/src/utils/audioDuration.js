function maxEndTime(items) {
  if (!Array.isArray(items) || items.length === 0) return null

  let max = 0
  for (const item of items) {
    const end = item?.end
    if (typeof end === 'number' && Number.isFinite(end) && end > max) {
      max = end
    }
  }

  return max > 0 ? max : null
}

export function durationFromTranscriptContent(content) {
  if (!content || typeof content !== 'object') return null

  if (typeof content.duration === 'number' && content.duration > 0) {
    return content.duration
  }

  const fromWords = maxEndTime(content.words)
  if (fromWords != null) return fromWords

  const fromSegments = maxEndTime(content.segments)
  if (fromSegments != null) return fromSegments

  return null
}

/**
 * 청구 가능한 오디오 길이(초). Cloudinary·전사 결과 모두 초 단위 float.
 * 밀리초 정밀도는 초의 소수부로 표현됩니다 (예: 90.452초).
 */
export function resolveBillableSeconds({ upload, transcriptContent }) {
  const fromContent = durationFromTranscriptContent(transcriptContent)
  const fromUpload =
    typeof upload?.duration === 'number' && upload.duration > 0 ? upload.duration : null

  const seconds = fromContent ?? fromUpload
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) {
    return 0
  }

  return seconds
}
