import '../src/config/env.js'
import { connectDB } from '../src/config/db.js'
import Admin from '../src/models/Admin.js'

function parseArgs(argv) {
  const args = {}

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]

    if (arg === '--email' || arg === '-e') {
      args.email = argv[i + 1]
      i += 1
      continue
    }

    if (arg === '--password' || arg === '-p') {
      args.password = argv[i + 1]
      i += 1
      continue
    }

    if (arg === '--name' || arg === '-n') {
      args.name = argv[i + 1]
      i += 1
    }
  }

  return args
}

function printUsage() {
  console.log(`
관리자 계정 생성 스크립트

사용법:
  node scripts/create-admin.js --email admin@example.com --password secret123 --name "관리자"

옵션:
  --email,   -e   관리자 이메일 (필수)
  --password,-p   비밀번호 6자 이상 (필수)
  --name,    -n   표시 이름 (선택, 기본값: Admin)
`)
}

async function main() {
  const { email, password, name } = parseArgs(process.argv.slice(2))

  if (!email?.trim() || !password) {
    printUsage()
    process.exit(1)
  }

  if (password.length < 6) {
    console.error('오류: 비밀번호는 6자 이상이어야 합니다.')
    process.exit(1)
  }

  const normalizedEmail = email.trim().toLowerCase()
  const displayName = name?.trim() || 'Admin'

  await connectDB()

  const existing = await Admin.findOne({ email: normalizedEmail })

  if (existing) {
    existing.name = displayName
    existing.password = password
    await existing.save()

    console.log(`기존 관리자 계정을 업데이트했습니다: ${normalizedEmail}`)
    process.exit(0)
  }

  const admin = await Admin.create({
    name: displayName,
    email: normalizedEmail,
    password,
  })

  console.log(`관리자 계정을 생성했습니다: ${admin.email} (${admin.name})`)
  process.exit(0)
}

main().catch((err) => {
  console.error('관리자 계정 생성 실패:', err.message)
  process.exit(1)
})
