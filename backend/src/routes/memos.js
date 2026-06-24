import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import Memo from '../models/Memo.js'
import Transcript from '../models/Transcript.js'
import Upload from '../models/Upload.js'
import {
  backfillMemosForUser,
  deleteMemoResources,
  ensureMemoForTranscript,
} from '../utils/memo.js'
import { buildPreviewFromWords, extractMemoWords, normalizeMemoWord } from '../utils/memoWords.js'
import { toMemoResponse } from '../utils/serializers.js'

async function ensureMemoWordsFromTranscript(bundle) {
  if (Array.isArray(bundle.memo.words) && bundle.memo.words.length > 0) {
    return bundle.memo
  }

  const words = extractMemoWords(bundle.transcript.content ?? {})
  if (words.length === 0) return bundle.memo

  bundle.memo.words = words
  bundle.memo.preview = buildPreviewFromWords(words)
  bundle.memo.markModified('words')
  await bundle.memo.save()
  return bundle.memo
}

const router = Router()

async function loadMemoBundle(memoId, userId) {
  const memo = await Memo.findOne({ _id: memoId, user: userId })
  if (!memo) return null

  const [upload, transcript] = await Promise.all([
    Upload.findById(memo.upload),
    Transcript.findById(memo.transcript),
  ])

  if (!upload || !transcript) return null

  return { memo, upload, transcript }
}

router.get('/', authMiddleware, async (req, res) => {
  try {
    await backfillMemosForUser(req.user._id)

    const memos = await Memo.find({ user: req.user._id }).sort({ updatedAt: -1 })
    const uploadIds = memos.map((memo) => memo.upload)
    const transcriptIds = memos.map((memo) => memo.transcript)

    const [uploads, transcripts] = await Promise.all([
      Upload.find({ _id: { $in: uploadIds } }),
      Transcript.find({ _id: { $in: transcriptIds } }),
    ])

    const uploadMap = new Map(uploads.map((upload) => [upload._id.toString(), upload]))
    const transcriptMap = new Map(
      transcripts.map((transcript) => [transcript._id.toString(), transcript]),
    )

    const items = memos
      .map((memo) => {
        const upload = uploadMap.get(memo.upload.toString())
        const transcript = transcriptMap.get(memo.transcript.toString())
        if (!upload || !transcript) return null
        return toMemoResponse(memo, upload, transcript)
      })
      .filter(Boolean)

    res.json({ memos: items })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '메모 목록 조회에 실패했습니다.' })
  }
})

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const bundle = await loadMemoBundle(req.params.id, req.user._id)
    if (!bundle) {
      return res.status(404).json({ error: '메모를 찾을 수 없습니다.' })
    }

    await ensureMemoWordsFromTranscript(bundle)

    res.json(toMemoResponse(bundle.memo, bundle.upload, bundle.transcript, { includeWords: true }))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '메모 조회에 실패했습니다.' })
  }
})

router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, words } = req.body

    if (title == null && words === undefined) {
      return res.status(400).json({ error: '변경할 내용이 없습니다.' })
    }

    const bundle = await loadMemoBundle(req.params.id, req.user._id)
    if (!bundle) {
      return res.status(404).json({ error: '메모를 찾을 수 없습니다.' })
    }

    if (title != null) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ error: '제목을 입력해주세요.' })
      }
      bundle.memo.title = title.trim()
    }

    if (words !== undefined) {
      if (!Array.isArray(words)) {
        return res.status(400).json({ error: '단어 데이터 형식이 올바르지 않습니다.' })
      }

      bundle.memo.words = words
        .map((word, index) => normalizeMemoWord(word, index))
        .filter((word) => word.word)

      const previewText = bundle.memo.words
        .map((word) => word.word)
        .join(' ')
        .replace(/\s+/g, ' ')
        .slice(0, 80)

      if (previewText) {
        bundle.memo.preview = previewText
      }

      bundle.memo.markModified('words')
    }

    await bundle.memo.save()

    res.json(toMemoResponse(bundle.memo, bundle.upload, bundle.transcript, { includeWords: true }))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '메모 수정에 실패했습니다.' })
  }
})

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const bundle = await loadMemoBundle(req.params.id, req.user._id)
    if (!bundle) {
      return res.status(404).json({ error: '메모를 찾을 수 없습니다.' })
    }

    await deleteMemoResources(bundle.memo)

    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '메모 삭제에 실패했습니다.' })
  }
})

export default router
