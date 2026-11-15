import { SourceList } from '../components/SourceList'
import { useT } from '../i18n'
import { msg } from '../i18n/msg'
import { SOURCES, type Source } from '../data/sources'

const GROUPS: { kind: Source['kind']; title: string; note: string }[] = [
  { kind: 'nasa', title: msg('NASA'), note: msg('What spaceflight does to the body, and how crews counter it.') },
  { kind: 'partner', title: msg('Partner space agencies'), note: '' },
  { kind: 'clinical', title: msg('Clinical references'), note: msg('Where the number ranges and warning signs come from.') },
]

const APP_CHOICES = [
  msg('How a clinical category maps to OK, Watch or Act.'),
  msg('The wording of the self-care steps in each symptom result.'),
  msg('The stress check questions and their bands. It is not a validated scale.'),
  msg('The reaction test bands, which compare you with your own earlier tests.'),
  msg('The length of each exercise session.'),
  msg('What counts as a trend in the charts.'),
  msg('The radiation Watch and Act bands (50% and 80% of the career limit, and rates above the expected range).'),
  msg('How much each of the five hazards weighs at each mission location.'),
  msg('The daily routine, its time slots and how often each task repeats.'),
  msg('Points, ranks, streaks and mission patches.'),
]

export function Sources() {
  const t = useT()
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <p className="label">{t('Sources')}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t('Where the guidance comes from')}</h1>
        <p className="mt-2 text-sm text-ink-dim">
          {t('Every result in this app names its sources. This is the full list. Links need a connection.')}
        </p>
      </div>

      {GROUPS.map((group) => {
        const ids = SOURCES.filter((s) => s.kind === group.kind).map((s) => s.id)
        if (ids.length === 0) return null
        return (
          <section key={group.kind} className="panel rounded-3xl p-5">
            <h2 className="label">{t(group.title)}</h2>
            {group.note && <p className="mt-1 text-sm text-ink-dim">{t(group.note)}</p>}
            <SourceList sourceIds={ids} />
          </section>
        )
      })}

      <section className="panel rounded-3xl p-5">
        <h2 className="label">{t('Decided by this app')}</h2>
        <p className="mt-1 text-sm text-ink-dim">{t('These parts are our own design choices, not taken from a source:')}</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
          {APP_CHOICES.map((choice) => (
            <li key={choice}>{t(choice)}</li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-ink-faint">
          {t('AstroVitals is a self-care guide. It does not diagnose and does not replace the flight surgeon.')}
        </p>
      </section>
    </div>
  )
}
