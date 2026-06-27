import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { authMiddleware } from '../middleware/auth.js'
import Admin from '../models/Admin.js'
import User from '../models/User.js'

const router = Router()

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

function toUserResponse(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  }
}

async function isAdminEmail(email) {
  const admin = await Admin.findOne({ email: email.trim().toLowerCase() })
  return Boolean(admin)
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: '이름, 이메일, 비밀번호를 입력해주세요.' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: '비밀번호는 6자 이상이어야 합니다.' })
    }

    const normalizedEmail = email.trim().toLowerCase()

    if (await isAdminEmail(normalizedEmail)) {
      return res.status(403).json({ error: '관리자 계정은 일반 서비스에 가입할 수 없습니다.' })
    }

    const existing = await User.findOne({ email: normalizedEmail })
    if (existing) {
      return res.status(409).json({ error: '이미 사용 중인 이메일입니다.' })
    }

    const user = await User.create({
      name: name.trim(),
      email: email.trim(),
      password,
    })

    const token = signToken(user._id)

    res.status(201).json({ token, user: toUserResponse(user) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '회원가입에 실패했습니다.' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email?.trim() || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' })
    }

    const normalizedEmail = email.trim().toLowerCase()

    if (await isAdminEmail(normalizedEmail)) {
      return res.status(403).json({ error: '관리자 계정은 일반 서비스에 로그인할 수 없습니다.' })
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password')
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' })
    }

    const token = signToken(user._id)

    res.json({ token, user: toUserResponse(user) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '로그인에 실패했습니다.' })
  }
})

router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: toUserResponse(req.user) })
})

export default router
