import { randomUUID } from 'crypto'

const PORTONE_API_BASE = 'https://api.portone.io'

/** PG 주문번호(oid) 최대 길이 */
export const PG_ORDER_ID_MAX_LENGTH = 40

export function generatePortOneOrderId(prefix = '') {
  const uuid = randomUUID().replace(/-/g, '')
  const maxBody = PG_ORDER_ID_MAX_LENGTH - prefix.length
  return `${prefix}${uuid.slice(0, maxBody)}`
}

export const INICIS_OID_MAX_LENGTH = PG_ORDER_ID_MAX_LENGTH

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getApiSecret() {
  const secret = process.env.PORTONE_API_SECRET
  if (!secret) {
    throw Object.assign(new Error('포트원 API Secret이 설정되지 않았습니다.'), { statusCode: 503 })
  }
  return secret
}

export function getPortOneChannelKey() {
  const key = process.env.PORTONE_CHANNEL_KEY?.trim()
  if (!key) {
    throw Object.assign(new Error('포트원 채널 키(PORTONE_CHANNEL_KEY)가 설정되지 않았습니다.'), {
      statusCode: 503,
    })
  }
  return key
}

export function getPortOneStoreId() {
  const storeId = process.env.PORTONE_STORE_ID?.trim()
  if (!storeId) {
    throw Object.assign(new Error('포트원 Store ID가 설정되지 않았습니다.'), { statusCode: 503 })
  }
  return storeId
}

function formatPortOneError(body, fallback) {
  if (!body) return fallback
  if (typeof body.message === 'string') return body.message
  if (typeof body?.error?.message === 'string') return body.error.message
  if (typeof body.type === 'string') return `${body.type}${body.message ? `: ${body.message}` : ''}`
  return fallback
}

export async function fetchPortOnePayment(paymentId) {
  const storeId = getPortOneStoreId()
  const url = new URL(`${PORTONE_API_BASE}/payments/${encodeURIComponent(paymentId)}`)
  url.searchParams.set('storeId', storeId)

  const response = await fetch(url, {
    headers: {
      Authorization: `PortOne ${getApiSecret()}`,
    },
  })

  let body
  try {
    body = await response.json()
  } catch {
    body = null
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw Object.assign(
        new Error('포트원 V2 API Secret이 유효하지 않습니다. 콘솔 > 결제 연동에서 V2 API Secret을 확인해 주세요.'),
        { statusCode: 401, portoneBody: body },
      )
    }
    const message = formatPortOneError(body, '포트원 결제 조회에 실패했습니다.')
    throw Object.assign(new Error(message), { statusCode: response.status, portoneBody: body })
  }

  return body
}

/** PG 승인 직후 조회 지연(404) 대비 재시도 */
export async function fetchPortOnePaymentWithRetry(paymentId, { maxAttempts = 6, intervalMs = 1500 } = {}) {
  let lastError

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const payment = await fetchPortOnePayment(paymentId)
      if (payment.status === 'PAID' || attempt === maxAttempts) {
        return payment
      }
      lastError = Object.assign(new Error('아직 결제가 완료되지 않았습니다.'), { statusCode: 400 })
    } catch (err) {
      lastError = err
      const retryable = err.statusCode === 404 || err.statusCode === 400
      if (!retryable || attempt === maxAttempts) {
        throw err
      }
    }

    await sleep(intervalMs)
  }

  throw lastError ?? new Error('포트원 결제 조회에 실패했습니다.')
}

export function resolvePortOnePaidAmount(payment) {
  if (payment?.amount?.total != null) return Number(payment.amount.total)
  if (payment?.amount != null && typeof payment.amount === 'number') return payment.amount
  return null
}

/** PortOne이 리다이렉트 시 paymentId 쿼리를 붙이므로 URL에는 포함하지 않음 */
export function getFrontendRedirectUrl() {
  const base = (process.env.FRONTEND_URL ?? 'http://localhost:1000').replace(/\/$/, '')
  return `${base}/payment/complete`
}
