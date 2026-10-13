import type { Stat } from '../types'

type Props = { stat: Stat }

function Sparkline({ points }: { points: number[] }) {
  const max = Math.max(...points)
  const min = Math.min(...points)
  const span = max - min || 1
  const path = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * 100
      const y = 28 - ((point - min) / span) * 24
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-8 w-20 text-indigo-500">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export default function StatCard({ stat }: Props) {
  return (
    <article className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{stat.label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold tracking-tight text-zinc-900">{stat.value}</p>
          <p className="mt-1 text-xs text-zinc-500">{stat.delta}</p>
        </div>
        <Sparkline points={stat.trend} />
      </div>
    </article>
  )
}
