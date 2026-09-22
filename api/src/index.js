import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import registrationsRouter from './routes/registrations.js'
import familiesRouter from './routes/families.js'
import attendanceRouter from './routes/attendance.js'
import adminRouter from './routes/admin.js'

const app = express()

const allowedOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((s) => s.trim())

app.use(cors({
  origin: allowedOrigins.includes('*') ? true : allowedOrigins,
}))
app.use(express.json())

app.get('/', (req, res) => res.json({ ok: true, service: 'yaya65-api' }))
app.use('/api/registrations', registrationsRouter)
app.use('/api/families', familiesRouter)
app.use('/api/attendance', attendanceRouter)
app.use('/api/admin', adminRouter)

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`YAYA65 API running on port ${PORT}`))
