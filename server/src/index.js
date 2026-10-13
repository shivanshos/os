import express from 'express'
import { pool } from './db.js'
import activity from './routes/activity.js'
import projects from './routes/projects.js'
import stats from './routes/stats.js'

const app = express()
app.use(express.json())

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('select 1')
    res.json({ ok: true })
  } catch {
    res.status(503).json({ ok: false, error: 'database unavailable' })
  }
})

app.use('/api/projects', projects)
app.use('/api/activity', activity)
app.use('/api/stats', stats)

app.use((_req, res) => res.status(404).json({ error: 'not found' }))

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity.
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'internal error' })
})

const port = Number(process.env.PORT ?? 4000)
app.listen(port, '0.0.0.0', () => {
  console.log(`api listening on http://0.0.0.0:${port}`)
})
