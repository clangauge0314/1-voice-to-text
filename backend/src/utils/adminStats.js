import { getCreditPack } from '../constants/creditPacks.js'

const TREND_DAYS = 7
const TIMEZONE = 'Asia/Seoul'

function startOfTrendWindow() {
  const start = new Date()
  start.setDate(start.getDate() - (TREND_DAYS - 1))
  start.setHours(0, 0, 0, 0)
  return start
}

function buildDayKeys() {
  const keys = []
  const cursor = startOfTrendWindow()

  for (let i = 0; i < TREND_DAYS; i += 1) {
    const day = new Date(cursor)
    day.setDate(cursor.getDate() + i)
    keys.push(formatDayKey(day))
  }

  return keys
}

function formatDayKey(date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function countMap(rows) {
  return rows.reduce((acc, row) => {
    acc[row._id] = row.count
    return acc
  }, {})
}

function revenueMap(rows) {
  return rows.reduce((acc, row) => {
    acc[row._id] = row.revenue
    return acc
  }, {})
}

function fillDailyTrend(dayKeys, usersByDay, memosByDay, uploadsByDay, paymentsByDay, revenueByDay) {
  return dayKeys.map((date) => ({
    date,
    users: usersByDay[date] ?? 0,
    memos: memosByDay[date] ?? 0,
    uploads: uploadsByDay[date] ?? 0,
    payments: paymentsByDay[date] ?? 0,
    revenue: revenueByDay[date] ?? 0,
  }))
}

async function fetchRecentPayments(Payment, User) {
  const userCollection = User.collection.collectionName

  const payments = await Payment.aggregate([
    { $match: { status: 'paid' } },
    { $sort: { paidAt: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: userCollection,
        let: { userId: '$user' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: [
                  '$_id',
                  {
                    $convert: {
                      input: '$$userId',
                      to: 'objectId',
                      onError: null,
                      onNull: null,
                    },
                  },
                ],
              },
            },
          },
          { $project: { name: 1, email: 1 } },
        ],
        as: 'userDoc',
      },
    },
    {
      $unwind: {
        path: '$userDoc',
        preserveNullAndEmptyArrays: true,
      },
    },
  ])

  return payments.map((payment) => {
    const pack = getCreditPack(payment.packId)
    const userId = payment.user ? String(payment.user) : null

    return {
      id: payment._id.toString(),
      paymentId: payment.paymentId,
      packId: payment.packId,
      packLabel: pack?.label ?? payment.orderName ?? payment.packId ?? '-',
      amount: payment.amount,
      orderName: payment.orderName,
      paidAt: payment.paidAt ? new Date(payment.paidAt).toISOString() : null,
      userName: payment.userDoc?.name ?? '-',
      userEmail: payment.userDoc?.email ?? '-',
      userId,
    }
  })
}

export async function buildAdminStats({ User, Memo, Upload, Payment }) {
  const trendStart = startOfTrendWindow()
  const dayKeys = buildDayKeys()
  const dateGroup = {
    $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TIMEZONE },
  }
  const paidDateGroup = {
    $dateToString: { format: '%Y-%m-%d', date: '$paidAt', timezone: TIMEZONE },
  }

  const [
    users,
    memos,
    uploads,
    payments,
    revenueAgg,
    newUsersThisWeek,
    userTrend,
    memoTrend,
    uploadTrend,
    paymentTrend,
    revenueTrend,
    packDistribution,
    recentUsers,
    recentPayments,
  ] = await Promise.all([
    User.countDocuments(),
    Memo.countDocuments(),
    Upload.countDocuments(),
    Payment.countDocuments({ status: 'paid' }),
    Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    User.countDocuments({ createdAt: { $gte: trendStart } }),
    User.aggregate([
      { $match: { createdAt: { $gte: trendStart } } },
      { $group: { _id: dateGroup, count: { $sum: 1 } } },
    ]),
    Memo.aggregate([
      { $match: { createdAt: { $gte: trendStart } } },
      { $group: { _id: dateGroup, count: { $sum: 1 } } },
    ]),
    Upload.aggregate([
      { $match: { createdAt: { $gte: trendStart } } },
      { $group: { _id: dateGroup, count: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: { status: 'paid', paidAt: { $gte: trendStart } } },
      { $group: { _id: paidDateGroup, count: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: { status: 'paid', paidAt: { $gte: trendStart } } },
      { $group: { _id: paidDateGroup, revenue: { $sum: '$amount' } } },
    ]),
    Payment.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: '$packId',
          count: { $sum: 1 },
          revenue: { $sum: '$amount' },
        },
      },
      { $sort: { count: -1 } },
    ]),
    User.find().sort({ createdAt: -1 }).limit(5).select('name email createdAt').lean(),
    fetchRecentPayments(Payment, User),
  ])

  const dailyTrend = fillDailyTrend(
    dayKeys,
    countMap(userTrend),
    countMap(memoTrend),
    countMap(uploadTrend),
    countMap(paymentTrend),
    revenueMap(revenueTrend),
  )

  return {
    summary: {
      users,
      memos,
      uploads,
      payments,
      revenue: revenueAgg[0]?.total ?? 0,
      newUsersThisWeek,
    },
    dailyTrend,
    packDistribution: packDistribution.map((row) => ({
      packId: row._id,
      count: row.count,
      revenue: row.revenue,
    })),
    recentUsers: recentUsers.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: new Date(user.createdAt).toISOString(),
    })),
    recentPayments,
  }
}
