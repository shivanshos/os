import { GridIcon, LayersIcon, PulseIcon, SlidersIcon } from './icons'

export type ViewId = 'overview' | 'projects' | 'activity' | 'settings'

type NavItem = {
  id: ViewId
  label: string
  Icon: (props: { className?: string }) => React.ReactElement
}

export const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', Icon: GridIcon },
  { id: 'projects', label: 'Projects', Icon: LayersIcon },
  { id: 'activity', label: 'Activity', Icon: PulseIcon },
  { id: 'settings', label: 'Settings', Icon: SlidersIcon },
]

type Props = {
  active: ViewId
  onChange: (id: ViewId) => void
}

export default function Sidebar({ active, onChange }: Props) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col justify-between bg-[#0b0b0f] px-4 py-6 lg:flex">
      <div>
        <div className="flex items-center gap-3 px-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-semibold text-white">
            B4
          </span>
          <span className="text-sm font-semibold tracking-tight text-white">Base44 OS</span>
        </div>

        <nav className="mt-8 space-y-1">
          {navItems.map(({ id, label, Icon }) => {
            const isActive = id === active
            return (
              <button
                key={id}
                type="button"
                onClick={() => onChange(id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-white/10 font-medium text-white'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="rounded-2xl bg-white/5 p-3">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-zinc-700 text-xs font-medium text-zinc-100">
            OS
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-zinc-100">Workspace</p>
            <p className="truncate text-[11px] text-zinc-500">Pro plan</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
