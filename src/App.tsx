import { useCallback, useEffect, useMemo, useState } from 'react'
import { createProject, fetchActivity, fetchProjects, fetchStats } from './api'
import ActivityTable from './components/ActivityTable'
import NewProjectForm from './components/NewProjectForm'
import ProjectGrid from './components/ProjectGrid'
import SettingsPanel from './components/SettingsPanel'
import Sidebar, { type ViewId } from './components/Sidebar'
import StatCard from './components/StatCard'
import TopBar from './components/TopBar'
import type { Activity, Project, Stat } from './types'

const pipeline = [
  { label: 'Install dependencies', state: 'done' },
  { label: 'Type check and lint', state: 'done' },
  { label: 'Build bundle', state: 'active' },
  { label: 'Publish to preview', state: 'pending' },
]

type LoadStatus = 'loading' | 'ready' | 'error'

export default function App() {
  const [view, setView] = useState<ViewId>('overview')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [stats, setStats] = useState<Stat[]>([])
  const [activity, setActivity] = useState<Activity[]>([])
  const [projects, setProjects] = useState<Project[]>([])

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const [nextStats, nextActivity, nextProjects] = await Promise.all([
        fetchStats(),
        fetchActivity(),
        fetchProjects(),
      ])
      setStats(nextStats)
      setActivity(nextActivity)
      setProjects(nextProjects)
      setStatus('ready')
    } catch (error) {
      console.error('Failed to load workspace data', error)
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const refresh = useCallback(async () => {
    try {
      const [nextActivity, nextProjects] = await Promise.all([fetchActivity(), fetchProjects()])
      setActivity(nextActivity)
      setProjects(nextProjects)
    } catch (error) {
      console.error('Failed to refresh workspace data', error)
    }
  }, [])

  const handleCreateProject = useCallback(
    async (input: { name: string; description: string; tags: string[] }) => {
      await createProject(input)
      await refresh()
    },
    [refresh],
  )

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return activity
    return activity.filter((item) =>
      [item.actor, item.action, item.target, item.env, item.status].some((field) =>
        field.toLowerCase().includes(needle),
      ),
    )
  }, [activity, query])

  return (
    <div className="flex min-h-screen">
      <Sidebar active={view} onChange={setView} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar view={view} onViewChange={setView} query={query} onQueryChange={setQuery} />

        <main className="flex-1 px-6 py-6 lg:px-10 lg:py-8">
          {status === 'loading' && (
            <p className="text-sm text-zinc-500">Loading workspace…</p>
          )}

          {status === 'error' && (
            <div className="max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-5">
              <h2 className="text-sm font-semibold text-rose-900">Can’t reach the API</h2>
              <p className="mt-1 text-xs leading-relaxed text-rose-700">
                The workspace data could not be loaded. Check that the API service is
                running, then try again.
              </p>
              <button
                type="button"
                onClick={() => void load()}
                className="mt-4 rounded-xl bg-rose-600 px-3 py-2 text-xs font-medium text-white hover:bg-rose-700"
              >
                Retry
              </button>
            </div>
          )}

          {status === 'ready' && view === 'overview' && (
            <div className="space-y-6">
              <header>
                <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
                  Everything running today
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  A snapshot of your workspace: projects, deployments and recent activity.
                </p>
              </header>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                  <StatCard key={stat.id} stat={stat} />
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <ActivityTable rows={rows} query={query} />

                <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-semibold tracking-tight text-zinc-900">
                    Deploy pipeline
                  </h2>
                  <p className="mt-0.5 text-xs text-zinc-500">web-app · Production</p>

                  <ol className="mt-5 space-y-4">
                    {pipeline.map((step) => (
                      <li key={step.label} className="flex items-center gap-3">
                        <span
                          className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                            step.state === 'done'
                              ? 'bg-emerald-50 text-emerald-600'
                              : step.state === 'active'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-zinc-100 text-zinc-400'
                          }`}
                        >
                          {step.state === 'done' ? '✓' : step.state === 'active' ? '•' : ''}
                        </span>
                        <span
                          className={`text-sm ${
                            step.state === 'pending' ? 'text-zinc-400' : 'text-zinc-700'
                          }`}
                        >
                          {step.label}
                        </span>
                      </li>
                    ))}
                  </ol>

                  <div className="mt-6 rounded-xl bg-zinc-50 p-3 text-xs text-zinc-500">
                    3 of 4 steps complete — estimated 40s remaining.
                  </div>
                </section>
              </div>
            </div>
          )}

          {status === 'ready' && view === 'projects' && (
            <div className="space-y-6">
              <header>
                <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Projects</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {projects.length} project{projects.length === 1 ? '' : 's'} stored in the
                  workspace database.
                </p>
              </header>
              <NewProjectForm onCreate={handleCreateProject} />
              <ProjectGrid projects={projects} />
            </div>
          )}

          {status === 'ready' && view === 'activity' && (
            <div className="space-y-6">
              <header>
                <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Activity</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Every deployment, pull request and invitation in one place.
                </p>
              </header>
              <ActivityTable rows={rows} query={query} />
            </div>
          )}

          {status === 'ready' && view === 'settings' && (
            <div className="space-y-6">
              <header>
                <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Settings</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Workspace details and notification preferences.
                </p>
              </header>
              <SettingsPanel />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
