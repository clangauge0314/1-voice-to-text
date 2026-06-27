import { useAdminAuthStore } from '../stores/adminAuthStore'

const API_BASE = '/api/admin'

interface ApiError {
  error?: string
  clientIp?: string
}

async function parseError(response: Response) {
  try {
    const data = (await response.json()) as ApiError
    return data.error ?? '요청에 실패했습니다.'
  } catch {
    return '요청에 실패했습니다.'
  }
}

export async function adminApiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAdminAuthStore.getState().token
  const headers = new Headers(options.headers)

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    })
  } catch {
    throw new Error('서버에 연결할 수 없습니다. 백엔드(npm run dev)가 실행 중인지 확인해주세요.')
  }

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  return response.json() as Promise<T>
}

export interface AdminAuthResponse {
  token: string
  admin: {
    id: string
    name: string
    email: string
  }
}

export interface AdminStats {
  summary: {
    users: number
    memos: number
    uploads: number
    payments: number
    revenue: number
    newUsersThisWeek: number
  }
  dailyTrend: Array<{
    date: string
    users: number
    memos: number
    uploads: number
    payments: number
    revenue: number
  }>
  packDistribution: Array<{
    packId: string
    count: number
    revenue: number
  }>
  recentUsers: Array<{
    id: string
    name: string
    email: string
    createdAt: string
  }>
  recentPayments: Array<{
    id: string
    paymentId: string
    packId: string
    packLabel: string
    amount: number
    orderName: string
    paidAt: string | null
    userName: string
    userEmail: string
    userId: string | null
  }>
}

export function adminLogin(email: string, password: string) {
  return adminApiFetch<AdminAuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function fetchAdminMe() {
  return adminApiFetch<{ admin: AdminAuthResponse['admin'] }>('/auth/me')
}

export function fetchAdminStats() {
  return adminApiFetch<AdminStats>('/stats')
}

export async function checkAdminAccess(): Promise<
  { allowed: true } | { allowed: false; error: string; clientIp?: string }
> {
  try {
    const response = await fetch(`${API_BASE}/access-check`)

    if (response.ok) {
      return { allowed: true }
    }

    let clientIp: string | undefined
    try {
      const data = (await response.json()) as ApiError
      clientIp = data.clientIp
      return { allowed: false, error: data.error ?? '요청에 실패했습니다.', clientIp }
    } catch {
      return { allowed: false, error: '요청에 실패했습니다.' }
    }
  } catch {
    return { allowed: false, error: '서버에 연결할 수 없습니다.' }
  }
}
