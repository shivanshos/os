import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { query } from '../db.js'
import { wrap } from '../util.js'

const router = Router()

const toProject = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  progress: row.progress,
  tags: row.tags ?? [],
  owner: row.owner,
  updatedAt: row.updated_at,
})

router.get(
  '/',
  wrap(async (_req, res) => {
    const { rows } = await query('select * from projects order by updated_at desc')
    res.json(rows.map(toProject))
  }),
)

router.post(
  '/',
  wrap(async (req, res) => {
    const { name, description = '', tags = [], owner = 'MC' } = req.body ?? {}
    const trimmed = typeof name === 'string' ? name.trim() : ''
    if (!trimmed) return res.status(400).json({ error: 'name is required' })

    const { rows } = await query(
      `insert into projects (id, name, description, tags, owner)
       values ($1, $2, $3, $4, $5)
       returning *`,
      [randomUUID(), trimmed, description, tags, owner],
    )

    await query(
      `insert into activity (id, actor, initials, action, target, env, status)
       values ($1, 'You', 'YO', 'created', $2, 'Workspace', 'Success')`,
      [randomUUID(), trimmed],
    )

    res.status(201).json(toProject(rows[0]))
  }),
)

router.patch(
  '/:id',
  wrap(async (req, res) => {
    const { progress, name, description, tags } = req.body ?? {}
    if (progress != null && (progress < 0 || progress > 100)) {
      return res.status(400).json({ error: 'progress must be between 0 and 100' })
    }

    const { rows } = await query(
      `update projects set
         name = coalesce($2, name),
         description = coalesce($3, description),
         tags = coalesce($4, tags),
         progress = coalesce($5, progress),
         updated_at = now()
       where id = $1
       returning *`,
      [req.params.id, name ?? null, description ?? null, tags ?? null, progress ?? null],
    )

    if (rows.length === 0) return res.status(404).json({ error: 'project not found' })
    res.json(toProject(rows[0]))
  }),
)

router.delete(
  '/:id',
  wrap(async (req, res) => {
    const { rowCount } = await query('delete from projects where id = $1', [req.params.id])
    if (rowCount === 0) return res.status(404).json({ error: 'project not found' })
    res.status(204).end()
  }),
)

export default router
