import { getClientIp, normalizeIp } from '../utils/clientIp.js'

function parseAllowedIps() {
  const raw = process.env.ADMIN_ALLOWED_IPS ?? '127.0.0.1,::1'
  return raw
    .split(',')
    .map((ip) => normalizeIp(ip.trim()))
    .filter(Boolean)
}

export function ipWhitelistMiddleware(req, res, next) {
  if (process.env.ADMIN_IP_CHECK === 'false') {
    return next()
  }

  const allowedIps = parseAllowedIps()
  const clientIp = getClientIp(req)

  if (!allowedIps.includes(clientIp)) {
    return res.status(403).json({
      error: '허용되지 않은 IP입니다.',
      clientIp,
    })
  }

  next()
}
