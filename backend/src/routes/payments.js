import { Router } from 'express'
import mongoose from 'mongoose'
import { authMiddleware } from '../middleware/auth.js'
import { CREDIT_PACKS, getCreditPack, normalizeCreditPackId } from '../constants/creditPacks.js'
import Payment from '../models/Payment.js'
import User from '../models/User.js'
import {
  fetchPortOnePaymentWithRetry,
  generatePortOneOrderId,
  getFrontendRedirectUrl,
  getPortOneChannelKey,
  getPortOneStoreId,
  resolvePortOnePaidAmount,
} from '../utils/portone.js'
import { ensureCurrentPeriod, toUsageResponse } from '../utils/usage.js'

const router = Router()

function buildOrderName(packId) {
  const pack = getCreditPack(packId)
  if (!pack) return 'Voice-to-Text 크레딧 충전'
  const audioMinutes = Math.floor(pack.audioSeconds / 60)
  return `Voice-to-Text ${pack.label} 충전 (${audioMinutes}분 · AI ${pack.aiNotes}회)`
}

async function applyCreditPack({ user, order, session }) {
  user.plan = 'credit'
  user.audioSecondsBalance = Number(user.audioSecondsBalance ?? 0) + Number(order.creditAudioSeconds ?? 0)
  user.aiNotesBalance = Number(user.aiNotesBalance ?? 0) + Number(order.creditAiNotes ?? 0)
  await user.save({ session })
}

async function verifyPortonePayment({ order }) {
  const portonePayment = await fetchPortOnePaymentWithRetry(order.paymentId)
  const paidAmount = resolvePortOnePaidAmount(portonePayment)
  if (paidAmount == null || paidAmount !== Number(order.amount)) {
    throw Object.assign(new Error('결제 금액이 일치하지 않습니다.'), { statusCode: 400 })
  }

  if (portonePayment.status !== 'PAID') {
    throw Object.assign(new Error('아직 결제가 완료되지 않았습니다.'), { statusCode: 400 })
  }

  return portonePayment
}

async function finalizePaidOrder({ orderId, userId }) {
  let updatedUser = null

  await mongoose.connection.transaction(async (session) => {
    const order = await Payment.findById(orderId).session(session)
    if (!order) {
      throw Object.assign(new Error('결제 요청을 찾을 수 없습니다.'), { statusCode: 404 })
    }

    const user = await User.findById(userId).session(session)
    if (!user) {
      throw Object.assign(new Error('사용자를 찾을 수 없습니다.'), { statusCode: 404 })
    }

    if (order.status === 'paid') {
      updatedUser = user
      return
    }

    await applyCreditPack({ user, order, session })

    order.status = 'paid'
    order.portoneStatus = 'PAID'
    order.paidAt = new Date()
    await order.save({ session })
    updatedUser = user
  })

  return updatedUser
}

function resolveWebhookPaymentId(body) {
  const candidates = [
    body?.data?.paymentId,
    body?.data?.id,
    body?.paymentId,
    body?.id,
    body?.payment?.id,
  ]
  const paymentId = candidates.find((value) => typeof value === 'string' && value.trim().length > 0)
  return paymentId?.trim() ?? ''
}

router.post('/webhook/portone', async (req, res) => {
  try {
    const paymentId = resolveWebhookPaymentId(req.body)
    if (!paymentId) {
      return res.status(200).json({ ok: true, ignored: true })
    }

    const order = await Payment.findOne({ paymentId })
    if (!order) {
      return res.status(200).json({ ok: true, ignored: true })
    }

    if (order.status === 'paid') {
      return res.status(200).json({ ok: true, alreadyProcessed: true })
    }

    const user = await User.findById(order.user)
    if (!user) {
      return res.status(200).json({ ok: true, ignored: true })
    }

    await verifyPortonePayment({ order })
    await finalizePaidOrder({ orderId: order._id, userId: user._id })

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('포트원 웹훅 처리 실패:', err.portoneBody ?? err.message ?? err)
    return res.status(500).json({ error: '웹훅 처리에 실패했습니다.' })
  }
})

router.post('/prepare', authMiddleware, async (req, res) => {
  try {
    const packId = normalizeCreditPackId(req.body?.packId)
    if (!packId) {
      return res.status(400).json({ error: '유효하지 않은 충전 상품입니다.' })
    }

    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' })
    }

    const pack = CREDIT_PACKS[packId]
    const paymentId = generatePortOneOrderId('p')
    const orderName = buildOrderName(packId)

    await Payment.create({
      user: user._id,
      paymentId,
      packId,
      creditAudioSeconds: pack.audioSeconds,
      creditAiNotes: pack.aiNotes,
      orderName,
      amount: pack.price,
      currency: 'KRW',
      status: 'pending',
      paymentType: 'credit_pack',
    })

    const channelKey = getPortOneChannelKey()

    res.json({
      paymentId,
      packId,
      orderName,
      totalAmount: pack.price,
      currency: 'CURRENCY_KRW',
      storeId: getPortOneStoreId(),
      channelKey,
      redirectUrl: getFrontendRedirectUrl(),
      payMethod: 'CARD',
    })
  } catch (err) {
    console.error('결제 준비 실패:', err.message ?? err)
    const status = err.statusCode ?? 500
    const message = err instanceof Error ? err.message : '결제 준비에 실패했습니다.'
    res.status(status).json({ error: message })
  }
})

router.post('/complete', authMiddleware, async (req, res) => {
  try {
    const paymentId = typeof req.body?.paymentId === 'string' ? req.body.paymentId.trim() : ''

    if (!paymentId) {
      return res.status(400).json({ error: 'paymentId가 필요합니다.' })
    }

    const order = await Payment.findOne({ paymentId, user: req.user._id })
    if (!order) {
      return res.status(404).json({ error: '결제 요청을 찾을 수 없습니다.' })
    }

    if (order.status === 'paid') {
      const user = await ensureCurrentPeriod(req.user)
      return res.json({
        success: true,
        packId: order.packId,
        usage: toUsageResponse(user),
      })
    }

    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' })
    }

    await verifyPortonePayment({ order })
    const updatedUser = await finalizePaidOrder({ orderId: order._id, userId: user._id })
    const ensuredUser = await ensureCurrentPeriod(updatedUser ?? user)

    res.json({
      success: true,
      packId: order.packId,
      usage: toUsageResponse(ensuredUser),
      message: `${order.orderName} 충전이 완료되었습니다.`,
    })
  } catch (err) {
    console.error('결제 완료 처리 실패:', err.portoneBody ?? err.message ?? err)
    const status = err.statusCode ?? 500
    const message = err instanceof Error ? err.message : '결제 완료 처리에 실패했습니다.'
    res.status(status).json({ error: message })
  }
})

export default router
