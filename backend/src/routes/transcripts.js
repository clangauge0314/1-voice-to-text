import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import Transcript from '../models/Transcript.js'
import Upload from '../models/Upload.js'
import { ensureMemoForTranscript } from '../utils/memo.js'
import { downloadFile } from '../utils/downloadFile.js'
import { toTranscriptResponse } from '../utils/serializers.js'
import { transcribeAudio } from '../utils/whisperx.js'

const router = Router()

async function respondWithTranscript(res, statusCode, upload, transcript) {
  await ensureMemoForTranscript({
    userId: transcript.user,
    upload,
    transcript,
  })

  return res.status(statusCode).json(toTranscriptResponse(transcript))
}

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { uploadId } = req.body

    if (!uploadId) {
      return res.status(400).json({ error: 'uploadId가 필요합니다.' })
    }

    const upload = await Upload.findOne({ _id: uploadId, user: req.user._id })
    if (!upload) {
      return res.status(404).json({ error: '업로드를 찾을 수 없습니다.' })
    }

    let transcript = await Transcript.findOne({ upload: upload._id })

    if (transcript?.status === 'completed') {
      return respondWithTranscript(res, 200, upload, transcript)
    }

    if (transcript?.status === 'processing') {
      return res.status(409).json({ error: '이미 전사가 진행 중입니다.' })
    }

    if (!transcript) {
      transcript = await Transcript.create({
        upload: upload._id,
        user: req.user._id,
        status: 'processing',
      })
    } else {
      transcript.status = 'processing'
      transcript.error = null
      await transcript.save()
    }

    try {
      const { buffer, contentType } = await downloadFile(upload.cloudinaryUrl, upload.originalName)
      const content = await transcribeAudio(buffer, upload.originalName, contentType)

      transcript.content = content
      transcript.status = 'completed'
      transcript.error = null
      await transcript.save()

      return respondWithTranscript(res, 201, upload, transcript)
    } catch (err) {
      transcript.status = 'failed'
      transcript.error = err.message ?? '전사에 실패했습니다.'
      await transcript.save()

      return res.status(201).json(toTranscriptResponse(transcript))
    }
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '전사 요청에 실패했습니다.' })
  }
})

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const transcript = await Transcript.findOne({ _id: req.params.id, user: req.user._id })

    if (!transcript) {
      return res.status(404).json({ error: '전사 기록을 찾을 수 없습니다.' })
    }

    res.json(toTranscriptResponse(transcript))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '전사 조회에 실패했습니다.' })
  }
})

export default router
