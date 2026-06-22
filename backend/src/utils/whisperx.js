export async function transcribeAudio(buffer, filename, mimetype) {
  const baseUrl = process.env.WHISPERX_API_URL?.replace(/\/$/, '')

  if (!baseUrl) {
    throw new Error('WHISPERX_API_URL is not configured')
  }

  const formData = new FormData()
  formData.append('file', new Blob([buffer], { type: mimetype }), filename)

  const response = await fetch(`${baseUrl}/transcribe?output_format=json`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    let message = '전사 요청에 실패했습니다.'
    try {
      const error = await response.json()
      message = error.detail?.[0]?.msg ?? error.message ?? message
    } catch {
      // ignore parse error
    }
    throw new Error(message)
  }

  return response.json()
}
