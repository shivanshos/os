import pg from 'pg'

const { Pool } = pg

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ?? 'postgres://base44:base44_dev@localhost:5432/base44',
})

export const query = (text, params) => pool.query(text, params)
