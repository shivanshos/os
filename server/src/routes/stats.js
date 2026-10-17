import { Router } from 'express'
import { query } from '../db.js'
import { wrap } from '../util.js'

const router = Router()

router.get(
  '/',
  wrap(async (_req, res) => {
    const { rows } = await query('select * from metrics order by position asc')
    res.json(
      rows.map((row) => ({
        id: row.id,
        label: row.label,
        value: row.value,
        delta: row.delta,
        trend: row.trend,
      })),
    )
  }),
)

export default router
