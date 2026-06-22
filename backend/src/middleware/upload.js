import multer from 'multer'

const storage = multer.memoryStorage()

const allowedMimeTypes = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/webm',
  'audio/mp4',
  'audio/aac',
  'audio/flac',
  'application/ogg',
  'video/mp4',
  'video/webm',
  'video/quicktime',
])

const allowedExtensions = /\.(mp3|wav|ogg|m4a|aac|flac|webm|mp4|mov|mkv)$/i

export const uploadAudio = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isAllowedMime =
      file.mimetype.startsWith('audio/') ||
      file.mimetype.startsWith('video/') ||
      allowedMimeTypes.has(file.mimetype)
    const isAllowedExt = allowedExtensions.test(file.originalname)

    if (isAllowedMime || isAllowedExt) {
      cb(null, true)
      return
    }

    cb(new Error('오디오 또는 비디오 파일만 업로드할 수 있습니다.'))
  },
})
