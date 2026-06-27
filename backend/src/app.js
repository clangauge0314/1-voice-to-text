import cors from 'cors'
import express from 'express'
import multer from 'multer'
import routes from './routes/index.js'

const app = express()

app.set('trust proxy', 1)

app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:1000' }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api', routes)

app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' })
})

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '파일 크기는 100MB 이하여야 합니다.' })
    }
    return res.status(400).json({ error: err.message })
  }

  if (err.message === '오디오 또는 비디오 파일만 업로드할 수 있습니다.') {
    return res.status(400).json({ error: err.message })
  }

  console.error(err)
  res.status(500).json({ error: 'Internal Server Error' })
})
export default app
