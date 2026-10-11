import type { Activity, Status } from '../data'

const statusStyles: Record<Status, string> = {
  Success: 'bg-emerald-50 text-emerald-700',
  Running: 'bg-amber-50 text-amber-700',
  Failed: 'bg-rose-50 text-rose-700',
}

const dotStyles: Record<Status, string> = {
  Success: 'bg-emerald-500',
  Running: 'bg-amber-500',
  Failed: 'bg-rose-500',
}

type Props = {
  rows: Activity[]
  query?: string
}

export default function ActivityTable({ rows, query = '' }: Props) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-zinc-900">Recent activity</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            {query.trim() ? `${rows.length} matching “${query.trim()}”` : 'Latest events across your workspace'}
          </p>
        </div>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600">
          {rows.length} events
        </span>
      </header>

      {rows.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-zinc-500">
          No activity matches that search.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {rows.map((item) => (
            <li key={item.id} className="flex items-center gap-4 px-5 py-3.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-50 text-[11px] font-semibold text-indigo-600">
                {item.initials}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-zinc-700">
                  <span className="font-medium text-zinc-900">{item.actor}</span> {item.action}{' '}
                  <span className="font-medium text-zinc-900">{item.target}</span>
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {item.env} · {item.time}
                </p>
              </div>

              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${statusStyles[item.status]}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[item.status]}`} />
                {item.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
