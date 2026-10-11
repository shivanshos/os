import { BellIcon, SearchIcon } from './icons'
import { navItems, type ViewId } from './Sidebar'

type Props = {
  view: ViewId
  onViewChange: (id: ViewId) => void
  query: string
  onQueryChange: (value: string) => void
}

export default function TopBar({ view, onViewChange, query, onQueryChange }: Props) {
  const title = navItems.find((item) => item.id === view)?.label ?? 'Overview'

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200/80 bg-white/80 backdrop-blur">
      <div className="flex items-center gap-4 px-6 py-4 lg:px-10">
        <h1 className="text-sm font-semibold tracking-tight text-zinc-900">{title}</h1>

        <div className="ml-auto flex items-center gap-3">
          <label className="relative hidden sm:block">
            <span className="sr-only">Search activity</span>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search activity"
              className="w-56 rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <button
            type="button"
            className="relative grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900"
            aria-label="Notifications"
          >
            <BellIcon />
            <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-indigo-500" />
          </button>

          <span className="hidden h-9 w-9 place-items-center rounded-full bg-zinc-900 text-xs font-medium text-white sm:grid">
            MC
          </span>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-6 pb-2 lg:hidden">
        {navItems.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onViewChange(id)}
            aria-current={id === view ? 'page' : undefined}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs transition ${
              id === view ? 'bg-zinc-900 font-medium text-white' : 'text-zinc-500 hover:bg-zinc-100'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>
    </header>
  )
}
