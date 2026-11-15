import { useLiveQuery } from 'dexie-react-hooks'
import { Droplet, Scale, Utensils } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { NumberField } from '../components/NumberField'
import { SourceList } from '../components/SourceList'
import { StatusPill } from '../components/status'
import type { IndicatorField } from '../data/indicators'
import { useT } from '../i18n'
import { msg } from '../i18n/msg'
import { addIntake, db } from '../lib/db'
import { parseField } from '../lib/fields'
import { assessMass, assessMeals, massChange, MEALS_PER_DAY, recentMealShare, today, WATER_TARGET_ML } from '../lib/nutrition'
import { useNow } from '../lib/useRecords'

const MASS_FIELD: IndicatorField = { key: 'kg', label: msg('Body mass'), min: 30, max: 200, step: 0.1, start: 75 }

/** Water, meals and body mass: the food system is one of the risks NASA tracks on long missions. */
export function Nutrition() {
  const t = useT()
  const now = useNow()
  const intake = useLiveQuery(() => db.intake.toArray(), [])
  const [mass, setMass] = useState('')
  if (!intake) return null

  const day = today(intake, now)
  const share = recentMealShare(intake, now)
  const meals = share !== null ? assessMeals(share) : null
  const m = massChange(intake)
  const massA = m ? assessMass(m.change) : null
  const lastMass = intake.filter((x) => x.kind === 'mass').sort((a, b) => b.at - a.at)[0]
  const waterPct = Math.min(1, day.water / WATER_TARGET_ML)
  const massValue = parseField(MASS_FIELD, mass)

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <p className="label">{t('Nutrition')}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t('Water, meals and body mass')}</h1>
        <p className="mt-2 text-sm text-ink-dim">
          {t('On long missions appetite often drops and the body loses mass without anyone noticing. Two taps a meal keep it visible.')}
        </p>
      </div>

      <section className="panel rounded-3xl p-5">
        <h2 className="label flex items-center gap-2">
          <Droplet size={14} aria-hidden /> {t('Water today')}
        </h2>
        <p className="mt-2 flex items-baseline gap-2">
          <span className="text-4xl font-semibold tabular-nums">{(day.water / 1000).toFixed(2)}</span>
          <span className="text-ink-dim">{t('of {n} L', { n: WATER_TARGET_ML / 1000 })}</span>
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
          <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${waterPct * 100}%` }} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[250, 500, 750].map((ml) => (
            <button
              key={ml}
              type="button"
              onClick={() => void addIntake('water', ml)}
              className="panel min-h-12 rounded-2xl text-sm font-medium active:bg-panel-2"
            >
              +{ml} mL
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-faint">{t('The 2 L target is this app’s choice. Follow your flight surgeon’s plan if it differs.')}</p>
      </section>

      <section className="panel rounded-3xl p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="label flex items-center gap-2">
            <Utensils size={14} aria-hidden /> {t('Meals today')}
          </h2>
          <span className="text-sm tabular-nums text-ink-dim">
            {day.meals} / {MEALS_PER_DAY}
          </span>
        </div>
        <p className="mt-2 text-sm">{t('After each meal: how much of the planned meal did you eat?')}</p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {[
            { v: 0, label: msg('None') },
            { v: 0.5, label: msg('Half') },
            { v: 0.75, label: msg('Most') },
            { v: 1, label: msg('All') },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => void addIntake('meal', o.v)}
              className="panel min-h-12 rounded-2xl text-sm font-medium active:bg-panel-2"
            >
              {t(o.label)}
            </button>
          ))}
        </div>
        {meals ? (
          <div className="mt-4 border-t border-line pt-4">
            <StatusPill status={meals.status} label={meals.label} />
            <p className="mt-2 text-sm text-ink-dim">
              {t('Last days: {n}% of planned meals eaten.', { n: Math.round(share! * 100) })} {t(meals.advice)}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-xs text-ink-faint">{t('Log meals on 2 days to see how you are eating.')}</p>
        )}
      </section>

      <section className="panel space-y-3 rounded-3xl p-5">
        <h2 className="label flex items-center gap-2">
          <Scale size={14} aria-hidden /> {t('Body mass, once a week')}
        </h2>
        <p className="text-sm text-ink-dim">
          {t('In weightlessness a normal scale does not work. Use the mass measurement device on board.')}
        </p>
        {m && massA && (
          <div>
            <StatusPill status={massA.status} label={massA.label} />
            <p className="mt-2 text-sm text-ink-dim">
              {t('{latest} kg now, {change}% from your start ({base} kg).', {
                latest: m.latest.toFixed(1),
                base: m.baseline.toFixed(1),
                change: (m.change * 100).toFixed(1),
              })}{' '}
              {t(massA.advice)}
            </p>
          </div>
        )}
        <NumberField field={{ ...MASS_FIELD, start: lastMass?.amount ?? 75 }} unit="kg" value={mass} onChange={setMass} />
        <button
          type="button"
          disabled={massValue === undefined}
          onClick={async () => {
            await addIntake('mass', massValue!)
            setMass('')
          }}
          className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-ink font-semibold text-space disabled:opacity-40"
        >
          {t('Save body mass')}
        </button>
      </section>

      <section className="rounded-3xl border border-accent/30 bg-accent/8 p-5 text-sm">
        <p className="font-semibold">{t('From a real mission')}</p>
        <p className="mt-1 text-ink-dim">
          {t('In NASA’s Twins Study, Scott Kelly lost 7% of his body mass during a year in space and ate about 30% fewer calories than expected.')}
        </p>
        <p className="mt-2 text-ink-dim">
          {t('Potassium matters too: low potassium was suspected in the Apollo 15 heart rhythm problems.')}{' '}
          <Link to="/scenarios" className="text-accent">
            {t('See the case')}
          </Link>
        </p>
        <SourceList sourceIds={['nasa-twins', 'nasa-apollo-medical', 'hrp-risks']} />
      </section>
    </div>
  )
}
