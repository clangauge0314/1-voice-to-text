import Memo from '../models/Memo.js'
import Transcript from '../models/Transcript.js'
import Upload from '../models/Upload.js'
import { deleteAsset } from './cloudinaryUpload.js'
import { buildPreviewFromWords, extractMemoWords } from './memoWords.js'

function fileNameToTitle(fileName) {
  return fileName.replace(/\.[^.]+$/, '') || '새 메모'
}

function buildPreview(content) {
  const transcript = typeof content?.transcript === 'string' ? content.transcript : ''
  const cleaned = transcript.replace(/\[(?:SPEAKER_\d+|UNKNOWN)\]\s*/gi, '').trim()
  return cleaned.replace(/\s+/g, ' ').slice(0, 80) || '전사 내용 없음'
}

export async function ensureMemoForTranscript({ userId, upload, transcript }) {
  if (!upload || !transcript || transcript.status !== 'completed') {
    return null
  }

  const content = transcript.content ?? {}
  const title = fileNameToTitle(content.filename ?? upload.originalName)
  const preview = buildPreview(content)
  const transcriptWords = extractMemoWords(content)

  let memo = await Memo.findOne({ upload: upload._id })

  if (memo) {
    memo.transcript = transcript._id
    memo.preview = preview
    if ((!memo.words || memo.words.length === 0) && transcriptWords.length > 0) {
      memo.words = transcriptWords
      memo.preview = buildPreviewFromWords(transcriptWords)
      memo.markModified('words')
    }
    await memo.save()
    return memo
  }

  return Memo.create({
    user: userId,
    upload: upload._id,
    transcript: transcript._id,
    title,
    preview: transcriptWords.length > 0 ? buildPreviewFromWords(transcriptWords) : preview,
    words: transcriptWords.length > 0 ? transcriptWords : null,
  })
}

export async function backfillMemosForUser(userId) {
  const transcripts = await Transcript.find({ user: userId, status: 'completed' }).populate('upload')

  for (const transcript of transcripts) {
    if (!transcript.upload) continue
    await ensureMemoForTranscript({
      userId,
      upload: transcript.upload,
      transcript,
    })
  }
}

export async function deleteMemoResources(memo) {
  const upload = await Upload.findById(memo.upload)

  if (upload?.publicId) {
    try {
      await deleteAsset(upload.publicId, 'video')
    } catch (err) {
      console.error('Cloudinary delete failed:', err)
    }
  }

  await Promise.all([
    Transcript.deleteOne({ _id: memo.transcript }),
    Upload.deleteOne({ _id: memo.upload }),
    Memo.deleteOne({ _id: memo._id }),
  ])
}
