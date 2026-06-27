export function normalizeIp(ip) {
  if (!ip) return ''

  const value = String(ip).trim()
  if (value.startsWith('::ffff:')) {
    return value.slice(7)
  }

  return value
}

export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return normalizeIp(forwarded.split(',')[0])
  }

  return normalizeIp(req.ip || req.socket?.remoteAddress)
}
