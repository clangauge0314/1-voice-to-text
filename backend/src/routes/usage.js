import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { ensureCurrentPeriod, toUsageResponse } from '../utils/usage.js'

const router = Router()

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await ensureCurrentPeriod(req.user)
    res.json(toUsageResponse(user))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '사용량 조회에 실패했습니다.' })
  }
})

export default router
