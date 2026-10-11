export type Status = 'Success' | 'Running' | 'Failed'

export type Activity = {
  id: string
  actor: string
  initials: string
  action: string
  target: string
  env: string
  status: Status
  time: string
}

export type Stat = {
  id: string
  label: string
  value: string
  delta: string
  trend: number[]
}

export type Project = {
  id: string
  name: string
  description: string
  progress: number
  tags: string[]
  owner: string
  updated: string
}

export const stats: Stat[] = [
  {
    id: 'projects',
    label: 'Active projects',
    value: '12',
    delta: '+2 this week',
    trend: [4, 6, 5, 8, 7, 10, 12],
  },
  {
    id: 'deploys',
    label: 'Deployments',
    value: '148',
    delta: '98% success rate',
    trend: [12, 18, 15, 22, 26, 24, 31],
  },
  {
    id: 'storage',
    label: 'Storage used',
    value: '68.4 GB',
    delta: 'of 100 GB',
    trend: [30, 34, 38, 41, 47, 55, 68],
  },
  {
    id: 'team',
    label: 'Team members',
    value: '9',
    delta: '+1 this month',
    trend: [5, 6, 6, 7, 8, 8, 9],
  },
]

export const activity: Activity[] = [
  {
    id: 'a1',
    actor: 'Maya Chen',
    initials: 'MC',
    action: 'deployed',
    target: 'web-app',
    env: 'Production',
    status: 'Success',
    time: '4 minutes ago',
  },
  {
    id: 'a2',
    actor: 'Deploy Bot',
    initials: 'DB',
    action: 'built',
    target: 'api-server',
    env: 'Staging',
    status: 'Running',
    time: '11 minutes ago',
  },
  {
    id: 'a3',
    actor: 'Jonas Weber',
    initials: 'JW',
    action: 'opened a pull request in',
    target: 'design-system',
    env: 'Preview',
    status: 'Success',
    time: '32 minutes ago',
  },
  {
    id: 'a4',
    actor: 'Deploy Bot',
    initials: 'DB',
    action: 'failed to publish',
    target: 'docs-site',
    env: 'Production',
    status: 'Failed',
    time: '1 hour ago',
  },
  {
    id: 'a5',
    actor: 'Priya Nair',
    initials: 'PN',
    action: 'invited a teammate to',
    target: 'analytics',
    env: 'Workspace',
    status: 'Success',
    time: '2 hours ago',
  },
  {
    id: 'a6',
    actor: 'Maya Chen',
    initials: 'MC',
    action: 'rolled back',
    target: 'web-app',
    env: 'Production',
    status: 'Success',
    time: 'Yesterday',
  },
  {
    id: 'a7',
    actor: 'Sam Okafor',
    initials: 'SO',
    action: 'connected a database to',
    target: 'api-server',
    env: 'Staging',
    status: 'Success',
    time: 'Yesterday',
  },
]

export const projects: Project[] = [
  {
    id: 'p1',
    name: 'web-app',
    description: 'Customer-facing dashboard with live data and dark mode.',
    progress: 86,
    tags: ['React', 'Vite'],
    owner: 'MC',
    updated: '4 min ago',
  },
  {
    id: 'p2',
    name: 'api-server',
    description: 'REST API with background jobs and webhook delivery.',
    progress: 62,
    tags: ['Node', 'Postgres'],
    owner: 'SO',
    updated: '11 min ago',
  },
  {
    id: 'p3',
    name: 'design-system',
    description: 'Shared components, tokens and documentation site.',
    progress: 44,
    tags: ['Tokens', 'a11y'],
    owner: 'JW',
    updated: '32 min ago',
  },
  {
    id: 'p4',
    name: 'docs-site',
    description: 'Public documentation with search and versioning.',
    progress: 28,
    tags: ['MDX', 'Search'],
    owner: 'PN',
    updated: '1 hour ago',
  },
]
