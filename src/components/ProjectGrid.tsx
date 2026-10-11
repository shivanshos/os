import { projects } from '../data'

export default function ProjectGrid() {
  return (
    <section className="grid gap-4 sm:grid-cols-2">
      {projects.map((project) => (
        <article
          key={project.id}
          className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold tracking-tight text-zinc-900">
                {project.name}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">{project.description}</p>
            </div>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-zinc-900 text-[11px] font-medium text-white">
              {project.owner}
            </span>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500">
              <span>Progress</span>
              <span className="text-zinc-700">{project.progress}%</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600"
              >
                {tag}
              </span>
            ))}
            <span className="ml-auto text-[11px] text-zinc-400">Updated {project.updated}</span>
          </div>
        </article>
      ))}
    </section>
  )
}
