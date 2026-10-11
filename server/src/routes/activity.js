import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { query } from '../db.js'
import { wrap } from '../util.js'

const router = Router()

const STATUSES = ['Success', 'Running', 'Failed']

const toActivity = (row) => ({
  id: row.id,
  actor: row.actor,
  initials: row.initials,
  action: row.action,
  target: row.target,
  env: row.env,
  status: row.status,
  createdAt: row.created_at,
})

router.get(
  '/',
  wrap(async (req, res) => {
    const search = typeof req.query.q === 'string' ? req.query.q.trim() : ''

    const { rows } = search
      ? await query(
          `select * from activity
           where actor ilike $1 or action ilike $1 or target ilike $1
              or env ilike $1 or status ilike $1
           order by created_at desc
           limit 50`,
          [`%${search}%`],
        )
      : await query('select * from activity order by created_at desc limit 50')

    res.json(rows.map(toActivity))
  }),
)

router.post(
  '/',
  wrap(async (req, res) => {
    const { actor, initials, action, target, env = 'Workspace', status = 'Success' } = req.body ?? {}

    if (!actor || !initials || !action || !target) {
      return res.status(400).json({ error: 'actor, initials, action and target are required' })
    }
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${STATUSES.join(', ')}` })
    }

    const { rows } = await query(
      `insert into activity (id, actor, initials, action, target, env, status)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning *`,
      [randomUUID(), actor, initials, action, target, env, status],
    )

    res.status(201).json(toActivity(rows[0]))
  }),
)

export default router
