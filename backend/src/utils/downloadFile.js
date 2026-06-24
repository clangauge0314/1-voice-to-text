const MIME_BY_EXT = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.flac': 'audio/flac',
  '.webm': 'audio/webm',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.mkv': 'video/x-matroska',
}

export function guessMimeType(filename, headerType) {
  if (headerType && headerType !== 'application/octet-stream') {
    return headerType
  }

  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase()
  return MIME_BY_EXT[ext] ?? 'application/octet-stream'
}

export async function downloadFile(url, filename) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Cloudinary 파일을 불러올 수 없습니다.')
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  const contentType = guessMimeType(filename, response.headers.get('content-type'))

  return { buffer, contentType }
}
