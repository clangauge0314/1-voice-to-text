import { useAuthStore } from '../stores/authStore'
import type { UsageData } from '../stores/usageStore'

const API_BASE = '/api'

interface ApiError {
  error?: string
}

async function parseError(response: Response) {
  try {
    const data = (await response.json()) as ApiError
    return data.error ?? '요청에 실패했습니다.'
  } catch {
    return '요청에 실패했습니다.'
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token
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

export interface AuthResponse {
  token: string
  user: {
    id: string
    name: string
    email: string
  }
}

export function register(name: string, email: string, password: string) {
  return apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
}

export function login(email: string, password: string) {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function fetchMe() {
  return apiFetch<{ user: AuthResponse['user'] }>('/auth/me')
}

export function fetchUsage() {
  return apiFetch<UsageData>('/usage/me')
}

export interface UploadResponse {
  id: string
  url: string
  publicId: string
  originalName: string
  duration: number | null
  format: string
  bytes: number
  status: 'uploaded' | 'failed'
  createdAt: string
}

export interface TranscriptResponse {
  id: string
  uploadId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  content: unknown
  error: string | null
  createdAt: string
  updatedAt: string
}

export interface MemoWordResponse {
  id: number
  word: string
  start?: number
  end?: number
  speaker?: string | null
}

export interface MemoResponse {
  id: string
  title: string
  preview: string
  uploadId: string
  transcriptId: string
  audioUrl: string
  duration: number | null
  language: string | null
  speakers: string[]
  segmentCount: number | null
  wordCount: number | null
  words?: MemoWordResponse[]
  createdAt: string
  updatedAt: string
}

export function uploadAudio(file: File, onProgress?: (percent: number) => void) {
  return new Promise<UploadResponse>((resolve, reject) => {
    const token = useAuthStore.getState().token
    const xhr = new XMLHttpRequest()
    const formData = new FormData()
    formData.append('file', file)

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText) as UploadResponse)
        return
      }

      try {
        const data = JSON.parse(xhr.responseText) as ApiError
        reject(new Error(data.error ?? '업로드에 실패했습니다.'))
      } catch {
        reject(new Error('업로드에 실패했습니다.'))
      }
    })

    xhr.addEventListener('error', () => {
      reject(new Error('서버에 연결할 수 없습니다. 백엔드(npm run dev)가 실행 중인지 확인해주세요.'))
    })

    xhr.addEventListener('abort', () => {
      reject(new Error('업로드가 취소되었습니다.'))
    })

    xhr.open('POST', `${API_BASE}/uploads/audio`)
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    }
    xhr.send(formData)
  })
}

export function startTranscription(uploadId: string) {
  return apiFetch<TranscriptResponse>('/transcripts', {
    method: 'POST',
    body: JSON.stringify({ uploadId }),
  })
}

export function fetchTranscript(id: string) {
  return apiFetch<TranscriptResponse>(`/transcripts/${id}`)
}

export function fetchUpload(id: string) {
  return apiFetch<UploadResponse>(`/uploads/${id}`)
}

export function fetchMemos() {
  return apiFetch<{ memos: MemoResponse[] }>('/memos')
}

export function fetchMemo(id: string) {
  return apiFetch<MemoResponse>(`/memos/${id}`)
}

export function renameMemo(id: string, title: string) {
  return apiFetch<MemoResponse>(`/memos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  })
}

export function saveMemoWords(
  id: string,
  words: Array<{
    id: number
    word: string
    start?: number
    end?: number
    speaker?: string
  }>,
) {
  return apiFetch<MemoResponse>(`/memos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ words }),
  })
}

export function deleteMemo(id: string) {
  return apiFetch<{ success: boolean }>(`/memos/${id}`, {
    method: 'DELETE',
  })
}
