import { useMemo, useState } from 'react'
import ActivityTable from './components/ActivityTable'
import ProjectGrid from './components/ProjectGrid'
import SettingsPanel from './components/SettingsPanel'
import Sidebar, { type ViewId } from './components/Sidebar'
import StatCard from './components/StatCard'
import TopBar from './components/TopBar'
import { activity, stats } from './data'

const pipeline = [
  { label: 'Install dependencies', state: 'done' },
  { label: 'Type check and lint', state: 'done' },
  { label: 'Build bundle', state: 'active' },
  { label: 'Publish to preview', state: 'pending' },
]

export default function App() {
  const [view, setView] = useState<ViewId>('overview')
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return activity
    return activity.filter((item) =>
      [item.actor, item.action, item.target, item.env, item.status].some((field) =>
        field.toLowerCase().includes(needle),
      ),
    )
  }, [query])

  return (
    <div className="flex min-h-screen">
      <Sidebar active={view} onChange={setView} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar view={view} onViewChange={setView} query={query} onQueryChange={setQuery} />

        <main className="flex-1 px-6 py-6 lg:px-10 lg:py-8">
          {view === 'overview' && (
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

          {view === 'projects' && (
            <div className="space-y-6">
              <header>
                <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Projects</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Four projects in this workspace, ordered by recent activity.
                </p>
              </header>
              <ProjectGrid />
            </div>
          )}

          {view === 'activity' && (
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

          {view === 'settings' && (
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
