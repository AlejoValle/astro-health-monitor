import { ExternalLink } from 'lucide-react'
import { sourceById } from '../data/sources'

export function SourceList({ sourceIds }: { sourceIds: string[] }) {
  const sources = sourceIds.flatMap((id) => sourceById(id) ?? [])
  return (
    <ul className="mt-2 space-y-2">
      {sources.map((source) => (
        <li key={source.id}>
          <a href={source.url} target="_blank" rel="noreferrer" className="flex min-h-12 items-center gap-3 text-sm">
            <span className="flex-1">
              <span className="block text-ink-dim">{source.org}</span>
              <span className="block">{source.title}</span>
            </span>
            <ExternalLink size={16} className="shrink-0 text-ink-faint" aria-hidden />
          </a>
        </li>
      ))}
    </ul>
  )
}
