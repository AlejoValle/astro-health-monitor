import { SourceList } from '../components/SourceList'
import { SOURCES, type Source } from '../data/sources'

const GROUPS: { kind: Source['kind']; title: string; note: string }[] = [
  { kind: 'nasa', title: 'NASA', note: 'What spaceflight does to the body, and how crews counter it.' },
  { kind: 'partner', title: 'Partner space agencies', note: '' },
  { kind: 'clinical', title: 'Clinical references', note: 'Where the number ranges and warning signs come from.' },
]

const APP_CHOICES = [
  'How a clinical category maps to OK, Watch or Act.',
  'The wording of the self-care steps in each symptom result.',
  'The stress check questions and their bands. It is not a validated scale.',
  'The reaction test bands, which compare you with your own earlier tests.',
  'The length of each exercise session.',
  'What counts as a trend in the charts.',
]

export function Sources() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <p className="label">Sources</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Where the guidance comes from</h1>
        <p className="mt-2 text-sm text-ink-dim">
          Every result in this app names its sources. This is the full list. Links need a connection.
        </p>
      </div>

      {GROUPS.map((group) => {
        const ids = SOURCES.filter((s) => s.kind === group.kind).map((s) => s.id)
        if (ids.length === 0) return null
        return (
          <section key={group.kind} className="panel rounded-3xl p-5">
            <h2 className="label">{group.title}</h2>
            {group.note && <p className="mt-1 text-sm text-ink-dim">{group.note}</p>}
            <SourceList sourceIds={ids} />
          </section>
        )
      })}

      <section className="panel rounded-3xl p-5">
        <h2 className="label">Decided by this app</h2>
        <p className="mt-1 text-sm text-ink-dim">These parts are our own design choices, not taken from a source:</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
          {APP_CHOICES.map((choice) => (
            <li key={choice}>{choice}</li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-ink-faint">
          AstroVitals is a self-care guide. It does not diagnose and does not replace the flight surgeon.
        </p>
      </section>
    </div>
  )
}
