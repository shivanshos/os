import { useState } from 'react'

type ToggleProps = {
  id: string
  label: string
  description: string
  enabled: boolean
  onToggle: () => void
}

function Toggle({ id, label, description, enabled, onToggle }: ToggleProps) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-900">{label}</p>
        <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        onClick={onToggle}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          enabled ? 'bg-indigo-600' : 'bg-zinc-200'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            enabled ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )
}

export default function SettingsPanel() {
  const [workspace, setWorkspace] = useState('Base44 OS')
  const [autoDeploy, setAutoDeploy] = useState(true)
  const [notifications, setNotifications] = useState(false)

  return (
    <div className="max-w-2xl space-y-6">
      <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-900">Workspace</h2>
        <p className="mt-0.5 text-xs text-zinc-500">Shown across the product and in emails.</p>

        <label className="mt-5 block">
          <span className="text-xs font-medium text-zinc-600">Workspace name</span>
          <input
            value={workspace}
            onChange={(event) => setWorkspace(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </label>
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-900">Preferences</h2>
        <div className="mt-1 divide-y divide-zinc-100">
          <Toggle
            id="auto-deploy"
            label="Auto-deploy on push"
            description="Ship every merge to the main branch automatically."
            enabled={autoDeploy}
            onToggle={() => setAutoDeploy((value) => !value)}
          />
          <Toggle
            id="notifications"
            label="Email notifications"
            description="Daily digest of deployments and failures."
            enabled={notifications}
            onToggle={() => setNotifications((value) => !value)}
          />
        </div>
      </section>
    </div>
  )
}
