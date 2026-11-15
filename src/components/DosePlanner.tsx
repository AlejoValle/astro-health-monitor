import { Route } from 'lucide-react'
import { useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { MISSION_PLANS, type PlanId } from '../data/missionPlans'
import { CAREER_LIMIT_MSV, SOLAR_LABEL, type SolarActivity } from '../data/radiation'
import { useT } from '../i18n'
import { planDose } from '../lib/missionPlan'
import { useSettings } from '../lib/store'
import { DataBadge } from './DataBadge'

/** Plans the career dose of an example mission with NASA's rates for each place on the way. */
export function DosePlanner() {
  const t = useT()
  const prior = useSettings((s) => s.priorDoseMSv)
  const [planId, setPlanId] = useState<PlanId>('mars')
  const [solar, setSolar] = useState<SolarActivity>('max')
  const plan = MISSION_PLANS.find((p) => p.id === planId)!
  const r = planDose(plan, solar, prior)
  const over = r.limitDay !== null
  // A point every few days keeps the chart light on a phone.
  const step = Math.max(1, Math.round(r.days / 120))
  const data = r.series.filter((_, i) => i % step === 0 || i === r.series.length - 1)
  const top = Math.max(CAREER_LIMIT_MSV * 1.1, r.endMSv * 1.05)

  return (
    <section className="panel rounded-3xl p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="label flex items-center gap-2">
          <Route size={14} aria-hidden /> {t('Plan a mission')}
        </h2>
        <DataBadge kind="nasa" />
      </div>
      <p className="mt-2 text-sm text-ink-dim">
        {t('See how your career dose would grow over a whole mission, starting from your earlier missions ({n} mSv).', {
          n: Math.round(prior),
        })}
      </p>

      <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label={t('Mission')}>
        {MISSION_PLANS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={p.id === planId}
            onClick={() => setPlanId(p.id)}
            className={`min-h-10 rounded-full border px-3 text-sm ${
              p.id === planId ? 'border-accent/60 bg-accent/15 text-accent' : 'border-line text-ink-dim'
            }`}
          >
            {t(p.name)}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={t('Solar activity')}>
        {(['max', 'min'] as SolarActivity[]).map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={s === solar}
            onClick={() => setSolar(s)}
            className={`min-h-9 rounded-full border px-3 text-xs ${
              s === solar ? 'border-accent/60 bg-accent/15 text-accent' : 'border-line text-ink-dim'
            }`}
          >
            {t(SOLAR_LABEL[s].name)}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-faint">{t(plan.note)}</p>

      <div className="mt-3 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="var(--color-line)" vertical={false} />
            <XAxis dataKey="day" type="number" domain={[0, r.days]} tick={{ fill: 'var(--color-ink-dim)', fontSize: 11 }} tickLine={false} />
            <YAxis domain={[0, Math.ceil(top / 100) * 100]} tick={{ fill: 'var(--color-ink-dim)', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: 'var(--color-panel-2)', border: '1px solid var(--color-line)', borderRadius: 12 }}
              labelFormatter={(d) => t('Day {n}', { n: Number(d) })}
              formatter={(v) => [`${Math.round(Number(v))} mSv`, t('Career dose')]}
            />
            <ReferenceLine y={CAREER_LIMIT_MSV} stroke="var(--color-alert)" strokeDasharray="4 4" label={{ value: t('NASA limit'), fill: 'var(--color-alert)', fontSize: 11, position: 'insideTopLeft' }} />
            <Line type="monotone" dataKey="mSv" stroke={over ? 'var(--color-alert)' : 'var(--color-accent)'} strokeWidth={2.5} dot={false} isAnimationActive />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className={`mt-3 text-sm ${over ? 'text-alert' : ''}`}>
        {over
          ? t('This mission would pass the {limit} mSv career limit on day {day} of {days}.', {
              limit: CAREER_LIMIT_MSV,
              day: r.limitDay!,
              days: r.days,
            })
          : t('This mission adds about {add} mSv, ending at {end} mSv: {pct}% of the career limit.', {
              add: Math.round(r.missionMSv),
              end: Math.round(r.endMSv),
              pct: Math.round((r.endMSv / CAREER_LIMIT_MSV) * 100),
            })}
      </p>
      <p className="mt-2 text-xs text-ink-faint">
        {t('Daily rates from NASA for each place. The mission legs are simplified examples and solar storms are not included.')}
      </p>
    </section>
  )
}
