import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { adminAuthMiddleware } from '../../middleware/adminAuth.js'
import Admin from '../../models/Admin.js'

const router = Router()

function signAdminToken(adminId) {
  return jwt.sign({ adminId, type: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

function toAdminResponse(admin) {
  return {
    id: admin._id.toString(),
    name: admin.name,
    email: admin.email,
  }
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email?.trim() || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' })
    }

    const admin = await Admin.findOne({ email: email.trim().toLowerCase() }).select('+password')
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' })
    }

    const token = signAdminToken(admin._id)

    res.json({ token, admin: toAdminResponse(admin) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '관리자 로그인에 실패했습니다.' })
  }
})

router.get('/me', adminAuthMiddleware, (req, res) => {
  res.json({ admin: toAdminResponse(req.admin) })
})

export default router
