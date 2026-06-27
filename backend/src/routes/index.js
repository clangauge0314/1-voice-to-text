import { Router } from 'express'
import mongoose from 'mongoose'
import adminRoutes from './admin/index.js'
import authRoutes from './auth.js'
import memoRoutes from './memos.js'
import paymentRoutes from './payments.js'
import transcriptRoutes from './transcripts.js'
import uploadRoutes from './uploads.js'
import usageRoutes from './usage.js'

const router = Router()

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  })
})

router.use('/auth', authRoutes)
router.use('/admin', adminRoutes)
router.use('/usage', usageRoutes)
router.use('/uploads', uploadRoutes)
router.use('/transcripts', transcriptRoutes)
router.use('/memos', memoRoutes)
router.use('/payments', paymentRoutes)

export default router
