import './config/env.js'
import app from './app.js'
import { connectDB } from './config/db.js'

const PORT = process.env.PORT ?? 1001

try {
  await connectDB()
  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the other process or change PORT in .env`)
    } else {
      console.error('Server error:', err)
    }
    process.exit(1)
  })
} catch (err) {
  console.error('Failed to start server:', err)
  process.exit(1)
}
