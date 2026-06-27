import jwt from 'jsonwebtoken'
import Admin from '../models/Admin.js'

export async function adminAuthMiddleware(req, res, next) {
  let token = null
  const authHeader = req.headers.authorization

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7)
  } else if (req.query.token) {
    token = req.query.token
  }

  if (!token) {
    return res.status(401).json({ error: '관리자 인증이 필요합니다.' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (decoded.type !== 'admin' || !decoded.adminId) {
      return res.status(401).json({ error: '유효하지 않은 관리자 토큰입니다.' })
    }

    const admin = await Admin.findById(decoded.adminId).select('-password')
    if (!admin) {
      return res.status(401).json({ error: '유효하지 않은 관리자 토큰입니다.' })
    }

    req.admin = admin
    next()
  } catch {
    return res.status(401).json({ error: '유효하지 않은 관리자 토큰입니다.' })
  }
}
