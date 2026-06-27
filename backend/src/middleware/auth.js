import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export async function authMiddleware(req, res, next) {
  let token = null
  const authHeader = req.headers.authorization

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7)
  } else if (req.query.token) {
    token = req.query.token
  }

  if (!token) {
    return res.status(401).json({ error: '인증이 필요합니다.' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (decoded.type === 'admin') {
      return res.status(401).json({ error: '관리자 토큰으로는 일반 서비스에 접근할 수 없습니다.' })
    }

    const user = await User.findById(decoded.userId).select('-password')

    if (!user) {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다.' })
    }

    req.user = user
    next()
  } catch {
    return res.status(401).json({ error: '유효하지 않은 토큰입니다.' })
  }
}
