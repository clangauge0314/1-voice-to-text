import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { uploadAudio } from '../middleware/upload.js'
import Upload from '../models/Upload.js'
import { uploadBuffer } from '../utils/cloudinaryUpload.js'
import { toUploadResponse } from '../utils/serializers.js'

const router = Router()

router.post('/audio', authMiddleware, uploadAudio.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일을 선택해주세요.' })
    }

    const result = await uploadBuffer(req.file.buffer, {
      public_id: `${Date.now()}-${req.file.originalname.replace(/\.[^.]+$/, '')}`,
    })

    const record = await Upload.create({
      user: req.user._id,
      originalName: req.file.originalname,
      cloudinaryUrl: result.secure_url,
      publicId: result.public_id,
      duration: result.duration ?? null,
      format: result.format,
      bytes: result.bytes,
      status: 'uploaded',
    })

    res.status(201).json(toUploadResponse(record))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '파일 업로드에 실패했습니다.' })
  }
})

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const upload = await Upload.findOne({ _id: req.params.id, user: req.user._id })

    if (!upload) {
      return res.status(404).json({ error: '업로드를 찾을 수 없습니다.' })
    }

    res.json(toUploadResponse(upload))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '업로드 조회에 실패했습니다.' })
  }
})

export default router
