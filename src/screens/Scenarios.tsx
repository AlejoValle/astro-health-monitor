import { ArrowRight, FlaskConical, Loader2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { SCENARIOS, type Scenario } from '../data/scenarios'
import { locationById } from '../data/locations'
import { useT } from '../i18n'
import { getActiveProfileId, ROLES, switchProfile, useProfiles } from '../lib/profiles'
import { loadAllScenarios, loadScenario, removeDemoCrew } from '../lib/scenarioLoader'
import { useSettings } from '../lib/store'

/** Use cases: demo crew members with different conditions, to see how Tether reacts. */
export function Scenarios() {
  const t = useT()
  const language = useSettings((s) => s.language)
  const profiles = useProfiles()
  const [busy, setBusy] = useState<string | null>(null)
  const activeId = getActiveProfileId()
  const demoCount = profiles.filter((p) => p.scenario).length

  const open = async (s: Scenario) => {
    setBusy(s.id)
    const p = await loadScenario(s, language)
    switchProfile(p.id)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <p className="label">{t('Use cases')}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t('How Tether reacts')}</h1>
        <p className="mt-2 text-sm text-ink-dim">
          {t('Each case is a demo crew member with 14 days of simulated data. Open one to switch to them and see the warnings, the body map, the hazards and the report react.')}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={busy !== null}
          onClick={async () => {
            setBusy('all')
            await loadAllScenarios(language)
            setBusy(null)
          }}
          className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-ink px-4 font-semibold text-space disabled:opacity-50"
        >
          {busy === 'all' ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <FlaskConical size={18} aria-hidden />}
          {t('Load all as demo crew')}
        </button>
        {demoCount > 0 && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={async () => {
              if (!window.confirm(t('Delete all demo crew members from this device?'))) return
              setBusy('remove')
              await removeDemoCrew()
              window.location.reload()
            }}
            className="panel flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 font-medium"
          >
            <Trash2 size={16} aria-hidden /> {t('Remove demo crew ({n})', { n: demoCount })}
          </button>
        )}
      </div>

      <ul className="space-y-3">
        {SCENARIOS.map((s) => {
          const profile = profiles.find((p) => p.scenario === s.id)
          const active = profile?.id === activeId
          return (
            <li key={s.id} className={`panel rounded-3xl p-5 ${active ? 'border-accent/60' : ''}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">{t(s.title)}</h2>
                  <p className="text-sm text-ink-dim">
                    {s.person} · {t(ROLES[s.role])} · {t(locationById(s.location).name)}
                  </p>
                </div>
                {profile && (
                  <span className="rounded-full border border-line px-2.5 py-1 text-xs text-ink-dim">
                    {active ? t('Active') : t('Loaded')}
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm">{t(s.story)}</p>
              <h3 className="label mt-4">{t('How Tether reacts')}</h3>
              <ul className="mt-2 space-y-1.5 text-sm">
                {s.reactions.map((r) => (
                  <li key={r} className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                    <span className="text-ink-dim">{t(r)}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={busy !== null || active}
                onClick={() => void open(s)}
                className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-accent/50 font-semibold text-accent disabled:opacity-50"
              >
                {busy === s.id ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <ArrowRight size={18} aria-hidden />}
                {active ? t('You are viewing this crew member') : t('Open {name}', { name: s.person })}
              </button>
            </li>
          )
        })}
      </ul>

      <p className="px-1 text-xs text-ink-faint">
        {t('All data in these cases is simulated and labelled as such. Your own profile is not changed; switch back to it from Crew.')}
      </p>
    </div>
  )
}
