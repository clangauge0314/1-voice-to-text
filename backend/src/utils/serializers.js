export function toUploadResponse(record) {
  return {
    id: record._id.toString(),
    url: record.cloudinaryUrl,
    publicId: record.publicId,
    originalName: record.originalName,
    duration: record.duration,
    format: record.format,
    bytes: record.bytes,
    status: record.status,
    createdAt: record.createdAt,
  }
}

export function toTranscriptResponse(record) {
  return {
    id: record._id.toString(),
    uploadId: record.upload.toString(),
    status: record.status,
    content: record.content,
    error: record.error,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}

export function toMemoResponse(memo, upload, transcript, options = {}) {
  const { includeWords = false } = options
  const content = transcript?.content ?? {}

  const response = {
    id: memo._id.toString(),
    title: memo.title,
    preview: memo.preview,
    uploadId: upload._id.toString(),
    transcriptId: transcript._id.toString(),
    audioUrl: upload.cloudinaryUrl,
    duration: content.duration ?? upload.duration ?? null,
    language: content.language ?? null,
    speakers: Array.isArray(content.speakers) ? content.speakers : [],
    segmentCount: content.segment_count ?? null,
    wordCount: content.word_count ?? null,
    createdAt: memo.createdAt,
    updatedAt: memo.updatedAt,
  }

  if (includeWords && Array.isArray(memo.words) && memo.words.length > 0) {
    response.words = memo.words
  }

  return response
}
