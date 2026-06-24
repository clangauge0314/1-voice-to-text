import { GoogleGenerativeAI } from '@google/generative-ai'
import { buildWordNoteAiContext } from './memoContext.js'

const DEFAULT_MODEL = 'gemini-2.5-flash'

function formatTimestamp(seconds) {
  if (typeof seconds !== 'number' || Number.isNaN(seconds)) return null
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(2).padStart(mins > 0 ? 5 : 2, '0')
  return mins > 0 ? `${mins}:${secs}` : `${secs}s`
}

function buildWordNotePrompt(context) {
  const timeLabel =
    context.start != null || context.end != null
      ? [formatTimestamp(context.start), formatTimestamp(context.end)].filter(Boolean).join(' – ')
      : null

  return `당신은 음성 전사·통역 학습을 돕는 조교입니다.
사용자가 표시한 단어(또는 구)가 포함된 문장을, 아래 전사 맥락을 바탕으로 충분히 자세한 한국어 학습 메모로 풀어 쓰세요.

[전체 전사]
${context.fullTranscript}

[해당 문장]
${context.segmentText}

[대상 단어/구]
${context.targetWord}
${context.speaker ? `\n[화자]\n${context.speaker}` : ''}${timeLabel ? `\n[구간]\n${timeLabel}` : ''}${context.language ? `\n[언어]\n${context.language}` : ''}

작성 규칙:
- 반드시 충분히 길게 작성할 것. 한두 문장으로 요약하지 말 것.
- 최소 150자 이상, 보통 250~500자 분량 (약 6~12문장)
- 제목, 번호, 마크다운, 불릿 없이 평문 단락만 출력
- 아래 내용을 빠짐없이 자연스럽게 포함할 것:
  (1) 이 문장이 전체 대화 흐름에서 어떤 역할인지
  (2) 문장 전체 의미를 자연스러운 한국어로 풀어서 설명 (의역·번역 느낌으로 충분히)
  (3) 대상 단어/구의 사전적 의미와, 이 문장 안에서의 구체적 쓰임·문법·뉘앙스
  (4) 화자의 의도, 요청/명령/협상/강조 등 실제 화행(pragmatics)
  (5) 계약·비즈니스·일상 등 맥락상 중요한 함의가 있으면 설명
  (6) 학습에 도움이 되는 관련 표현·유의어·주의할 점이 있으면 덧붙일 것
- 대상이 짧은 단어 하나여도, 반드시 소속 문장 전체를 먼저 충분히 해석한 뒤 그 단어를 짚을 것
- 근거 없는 추측은 하지 말고, 불확실하면 "맥락상 ~로 보인다"고 표현할 것`
}

function getGenerationConfig() {
  return {
    temperature: 0.4,
    maxOutputTokens: 8192,
    thinkingConfig: {
      thinkingBudget: 0,
    },
  }
}

function extractFinishReason(result) {
  return result.response.candidates?.[0]?.finishReason ?? null
}

async function requestWordNote(model, prompt) {
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: getGenerationConfig(),
  })

  const note = result.response.text()?.trim() ?? ''
  return {
    note,
    finishReason: extractFinishReason(result),
  }
}
function getModel() {
  const apiKey = process.env.GOOGLE_AI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY가 설정되지 않았습니다.')
  }

  const modelName = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL
  const client = new GoogleGenerativeAI(apiKey)
  return client.getGenerativeModel({ model: modelName })
}

const MIN_NOTE_LENGTH = 180

export async function generateWordNoteWithGemini(contextInput) {
  const context = buildWordNoteAiContext(contextInput)
  const model = getModel()
  const prompt = buildWordNotePrompt(context)

  let { note, finishReason } = await requestWordNote(model, prompt)

  if (!note) {
    throw new Error('AI가 메모를 생성하지 못했습니다.')
  }

  if (note.length < MIN_NOTE_LENGTH || finishReason === 'MAX_TOKENS') {
    const retryPrompt = `${prompt}

이전 답변이 너무 짧거나 중간에 끊겼습니다. 반드시 300자 이상으로, 문장 전체 의미와 대상 표현 설명을 모두 포함해 처음부터 다시 작성하세요.`
    const retry = await requestWordNote(model, retryPrompt)
    if (retry.note.length > note.length) {
      note = retry.note
      finishReason = retry.finishReason
    }
  }

  if (note.length < 80) {
    throw new Error('AI 메모가 너무 짧게 생성되었습니다. 다시 시도해주세요.')
  }

  return {
    note,
    context,
  }
}
