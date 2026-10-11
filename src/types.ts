export type Status = 'Success' | 'Running' | 'Failed'

export type Stat = {
  id: string
  label: string
  value: string
  delta: string
  trend: number[]
}

export type Activity = {
  id: string
  actor: string
  initials: string
  action: string
  target: string
  env: string
  status: Status
  createdAt: string
}

export type Project = {
  id: string
  name: string
  description: string
  progress: number
  tags: string[]
  owner: string
  updatedAt: string
}
