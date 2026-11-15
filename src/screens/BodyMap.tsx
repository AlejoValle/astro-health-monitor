import { Stethoscope } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BodyMapFigure } from '../components/BodyMapFigure'
import { HAZARD_ICON } from '../components/HazardSummary'
import { SourceList } from '../components/SourceList'
import { StatusIcon, StatusPill } from '../components/status'
import { TrackerChip } from '../components/TrackerChip'
import { BODY_SYSTEMS, type BodySystem, type SystemId } from '../data/bodySystems'
import { HAZARDS, type HazardId } from '../data/hazards'
import { useT } from '../i18n'
import { msg } from '../i18n/msg'
import { trackerKey, trackersStatus, type TrackerStatus } from '../lib/hazards'
import type { Status } from '../lib/rules'
import { useTrackerStatus } from '../lib/useTrackerStatus'

const STATUS_WORD = { ok: msg('In range'), watch: msg('Keep an eye'), alert: msg('Act now') } as const
const RANK: Record<Status, number> = { ok: 1, watch: 2, alert: 3 }

export function BodyMap() {
  const status = useTrackerStatus()
  const t = useT()
  const [hazard, setHazard] = useState<HazardId | 'all'>('all')
  const [picked, setPicked] = useState<SystemId | null>(null)
  if (!status) return null

  const statuses = Object.fromEntries(
    BODY_SYSTEMS.map((s) => [s.id, trackersStatus(s.trackers, status)]),
  ) as Record<SystemId, Status | null>
  const highlighted = new Set(
    BODY_SYSTEMS.filter((s) => hazard === 'all' || s.hazards.includes(hazard)).map((s) => s.id),
  )
  // Open on the system that needs the most attention.
  const worstFirst = [...BODY_SYSTEMS].sort(
    (a, b) => (statuses[b.id] ? RANK[statuses[b.id]!] : 0) - (statuses[a.id] ? RANK[statuses[a.id]!] : 0),
  )
  const selected = BODY_SYSTEMS.find((s) => s.id === picked) ?? worstFirst[0]

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <p className="label">{t('Body map')}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t('How your body is doing')}</h1>
        <p className="mt-2 text-sm text-ink-dim">
          {t('Tap a part of the body to see what it does, what space does to it and what you track for it.')}
        </p>
      </div>

      <nav aria-label={t('Filter by hazard')} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        <FilterChip active={hazard === 'all'} onClick={() => setHazard('all')} label={t('All')} />
        {HAZARDS.map((h) => {
          const Icon = HAZARD_ICON[h.id]
          return (
            <FilterChip
              key={h.id}
              active={hazard === h.id}
              onClick={() => setHazard(h.id)}
              label={t(h.short)}
              icon={<Icon size={14} aria-hidden />}
            />
          )
        })}
      </nav>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="panel rounded-3xl p-4">
          <BodyMapFigure
            statuses={statuses}
            selected={selected.id}
            highlighted={highlighted}
            onSelect={setPicked}
          />
          <ul className="mt-2 grid grid-cols-2 gap-2">
            {BODY_SYSTEMS.map((s) => {
              const st = statuses[s.id]
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setPicked(s.id)}
                    aria-pressed={selected.id === s.id}
                    className={`flex min-h-12 w-full items-center gap-2 rounded-2xl border px-3 text-left text-sm transition-opacity ${
                      selected.id === s.id ? 'border-accent/60 bg-accent/10' : 'border-line'
                    } ${highlighted.has(s.id) ? '' : 'opacity-40'}`}
                  >
                    {st ? <StatusIcon status={st} size={14} /> : <span className="size-3.5 rounded-full border border-ink-faint" />}
                    <span className="flex-1">{t(s.name)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <SystemDetail key={selected.id} system={selected} status={statuses[selected.id]} trackers={status} />
      </div>
    </div>
  )
}

function SystemDetail({ system, status, trackers }: { system: BodySystem; status: Status | null; trackers: TrackerStatus }) {
  const t = useT()
  return (
    <section className="panel space-y-4 rounded-3xl p-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{t(system.name)}</h2>
        <div className="mt-2">
          {status ? (
            <StatusPill status={status} label={STATUS_WORD[status]} />
          ) : (
            <span className="text-xs text-ink-faint">{t('No measurement for this yet. Use the symptom guide if something feels wrong.')}</span>
          )}
        </div>
      </div>
      <Block title={t('What it does')}>{t(system.does)}</Block>
      <Block title={t('What space does to it')}>{t(system.space)}</Block>
      <div>
        <h3 className="label">{t('Hazards')}</h3>
        <ul className="mt-2 flex flex-wrap gap-2">
          {system.hazards.map((id) => {
            const h = HAZARDS.find((x) => x.id === id)!
            const Icon = HAZARD_ICON[id]
            return (
              <li key={id}>
                <Link to="/hazards" className="flex min-h-9 items-center gap-1.5 rounded-full bg-white/6 px-3 text-xs text-ink-dim">
                  <Icon size={13} aria-hidden />
                  {t(h.short)}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
      <div>
        <h3 className="label">{t('What you track')}</h3>
        <ul className="mt-2 flex flex-wrap gap-2">
          {system.trackers.map((tracker) => (
            <li key={trackerKey(tracker)}>
              <TrackerChip tracker={tracker} status={trackers} />
            </li>
          ))}
        </ul>
      </div>
      <Block title={t('Watch for')}>{t(system.watch)}</Block>
      <Link
        to={`/symptoms?a=${system.area}`}
        className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-ink font-semibold text-space"
      >
        <Stethoscope size={18} aria-hidden />
        {t('Check a symptom here')}
      </Link>
      <div>
        <h3 className="label">{t('Based on')}</h3>
        <SourceList sourceIds={system.sourceIds} />
      </div>
    </section>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="label">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed">{children}</p>
    </div>
  )
}

function FilterChip({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium ${
        active ? 'border-accent/60 bg-accent/10' : 'border-line bg-panel text-ink-dim'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
