import type { Activity, Project, Stat } from './types'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })

  if (!response.ok) {
    throw new Error(`${init?.method ?? 'GET'} ${path} failed with ${response.status}`)
  }

  return (await response.json()) as T
}

export const fetchStats = () => request<Stat[]>('/api/stats')

export const fetchActivity = () => request<Activity[]>('/api/activity')

export const fetchProjects = () => request<Project[]>('/api/projects')

export const createProject = (input: { name: string; description: string; tags: string[] }) =>
  request<Project>('/api/projects', { method: 'POST', body: JSON.stringify(input) })
