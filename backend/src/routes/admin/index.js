import { Router } from 'express'
import Memo from '../../models/Memo.js'
import Payment from '../../models/Payment.js'
import Upload from '../../models/Upload.js'
import User from '../../models/User.js'
import { adminAuthMiddleware } from '../../middleware/adminAuth.js'
import { ipWhitelistMiddleware } from '../../middleware/ipWhitelist.js'
import { buildAdminStats } from '../../utils/adminStats.js'
import { getClientIp } from '../../utils/clientIp.js'
import authRoutes from './auth.js'

const router = Router()

router.use(ipWhitelistMiddleware)

router.get('/access-check', (req, res) => {
  res.json({ allowed: true, clientIp: getClientIp(req) })
})

router.use('/auth', authRoutes)

router.get('/stats', adminAuthMiddleware, async (_req, res) => {
  try {
    const stats = await buildAdminStats({ User, Memo, Upload, Payment })
    res.json(stats)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '통계를 불러오지 못했습니다.' })
  }
})
export default router
