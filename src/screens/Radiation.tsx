import { FlaskConical, Radiation as RadiationIcon, ShieldAlert, Sun } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'motion/react'
import { ContactBanner } from '../components/ContactBanner'
import { CountUp } from '../components/CountUp'
import { NumberField } from '../components/NumberField'
import { SourceList } from '../components/SourceList'
import { StatusIcon, StatusPill } from '../components/status'
import type { IndicatorField } from '../data/indicators'
import { locationById } from '../data/locations'
import {
  CAREER_LIMIT_MSV,
  CHEST_XRAY_MSV,
  DOSE_RATE,
  EARTH_BACKGROUND_MSV_PER_YEAR,
  ISS_NEUTRON_SHARE,
  MSL_CRUISE_MSV_PER_DAY,
  RADIATION_SOURCE_IDS,
  SHIELDING,
  SOLAR_LABEL,
  SPE_LIMIT_MSV,
  STORM_DOSE,
  STORM_STEPS,
  type SolarActivity,
} from '../data/radiation'
import { useLocale, useT, type Vars } from '../i18n'
import { msg } from '../i18n/msg'
import { addDose } from '../lib/db'
import { parseField } from '../lib/fields'
import { expectedRate } from '../lib/radiation'
import { useSettings } from '../lib/store'
import { STATUS_STYLE } from '../lib/statusStyle'
import { useRadiation } from '../lib/useRadiation'

const EARTH_PER_DAY = EARTH_BACKGROUND_MSV_PER_YEAR / 365

const DOSE_FIELD: IndicatorField = { key: 'msv', label: msg('Mission dose on your dosimeter'), min: 0, max: 2000, step: 0.1, start: 0 }
const PRIOR_FIELD: IndicatorField = { key: 'prior', label: msg('Dose from earlier missions'), min: 0, max: 1500, step: 1, start: 0 }

const shortDate = (at: number, locale: string) => new Date(at).toLocaleDateString(locale, { month: 'short', day: 'numeric' })

const toDateInput = (at: number | null) => {
  if (at === null) return ''
  const d = new Date(at)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function describeDays(days: number, t: (text: string, vars?: Vars) => string) {
  if (days > 3650) return t('more than 10 years')
  if (days > 730) return t('about {n} years', { n: Math.round(days / 365) })
  if (days > 60) return t('about {n} months', { n: Math.round(days / 30) })
  return t('about {n} days', { n: Math.round(days) })
}

export function Radiation() {
  const state = useRadiation()
  const locationId = useSettings((s) => s.locationId)
  const t = useT()
  const locale = useLocale()
  if (!state) return null
  const { estimate, career, measured, rate, overall, doses, simulated } = state
  const location = locationById(locationId)

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <p className="label">{t('Radiation')}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t('Space radiation dose')}</h1>
        <p className="mt-2 text-sm text-ink-dim">
          {t(
            'You cannot see or feel space radiation. This keeps a running total from your dosimeter and the expected rate for your location ({place}).',
            { place: t(location.name) },
          )}
        </p>
      </div>

      {estimate && career && overall ? (
        <>
          <section className={`glass rounded-[32px] p-6 ${STATUS_STYLE[overall.status].glow}`}>
            <div className="flex items-start justify-between gap-3">
              <p className="label">{t('This mission')}</p>
              {simulated && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-ink-dim">
                  <FlaskConical size={12} aria-hidden />
                  {t('Simulated data')}
                </span>
              )}
            </div>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="text-5xl font-semibold tracking-tight">
                <CountUp value={Number(estimate.missionMSv.toFixed(1))} decimals={1} duration={1.4} />
              </span>
              <span className="text-ink-dim">mSv</span>
            </p>
            <p className="mt-1 text-sm text-ink-dim">
              {t('About {n} chest X-rays.', { n: Math.round(estimate.missionMSv / CHEST_XRAY_MSV) })}{' '}
              {estimate.basis === 'dosimeter'
                ? t('Last dosimeter reading plus the expected rate since.')
                : t('Estimated from the expected rate. Log your dosimeter to correct it.')}
            </p>

            <CareerBar careerMSv={estimate.careerMSv} />

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusPill status={career.status} label={career.label} />
              {rate && <StatusPill status={rate.status} label={`${t('Rate')}: ${t(rate.label)}`} />}
            </div>
            <p className="mt-3 text-sm text-ink-dim">
              {t('At {rate} mSv per day you would reach the career limit in {time}.', {
                rate: estimate.rate,
                time: describeDays(estimate.daysToLimit, t),
              })}
            </p>
          </section>

          <section className="panel rounded-3xl p-5">
            <h2 className="label">{t('What to do')}</h2>
            <p className="mt-2 text-lg leading-snug">{t(overall.advice)}</p>
          </section>
          {overall.escalate && <ContactBanner />}
        </>
      ) : (
        <section className="glass rounded-[32px] p-6">
          <RadiationIcon size={28} className="text-accent" aria-hidden />
          <h2 className="mt-3 text-xl font-semibold">{t('Set up your mission')}</h2>
          <p className="mt-1 text-sm text-ink-dim">
            {t('Enter when the mission started, or log your first dosimeter reading below, to see your dose.')}
          </p>
        </section>
      )}

      <StormProtocol />

      <section className="panel rounded-3xl p-5">
        <h2 className="label">{t('Dose rate here')}</h2>
        <RateRow />
        <p className="mt-2 text-sm text-ink-dim">{t(SHIELDING[locationId])}</p>
        {measured !== null && rate && (
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
            <div>
              <p className="text-sm text-ink-dim">{t('Measured by your dosimeter')}</p>
              <p className="text-xl font-semibold tabular-nums">{t('{n} mSv/day', { n: measured.toFixed(2) })}</p>
            </div>
            <StatusPill status={rate.status} label={rate.label} />
          </div>
        )}
      </section>

      <DoseLogger key={doses.length} suggested={estimate?.missionMSv} />

      {doses.length > 0 && (
        <section className="panel rounded-3xl p-5">
          <h2 className="label">{t('Dosimeter log')}</h2>
          <ul className="mt-2 divide-y divide-line">
            {[...doses].reverse().slice(0, 6).map((d) => (
              <li key={d.id} className="flex min-h-12 items-center justify-between text-sm">
                <span className="text-ink-dim">{shortDate(d.at, locale)}</span>
                <span className="flex items-center gap-2">
                  {d.origin === 'simulated' && <FlaskConical size={12} className="text-ink-faint" aria-label={t('Simulated data')} />}
                  <span className="font-medium tabular-nums">{d.mSv.toFixed(1)} mSv</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <MissionSetup />

      <section className="panel rounded-3xl p-5">
        <h2 className="label">{t('About the numbers')}</h2>
        <ul className="mt-2 space-y-2 text-sm text-ink-dim">
          <li>
            {t("NASA limits an astronaut's whole career to {career} mSv, and one solar storm to {storm} mSv.", {
              career: CAREER_LIMIT_MSV,
              storm: SPE_LIMIT_MSV,
            })}
          </li>
          <li>{t('On Earth, natural background radiation is about {n} mSv a year.', { n: EARTH_BACKGROUND_MSV_PER_YEAR })}</li>
          <li>
            {t(
              "On its way to Mars, NASA's Curiosity rover measured about {n} mSv per day inside its cruise stage. Real values depend on shielding and the solar cycle.",
              { n: MSL_CRUISE_MSV_PER_DAY },
            )}
          </li>
          <li>
            {t('On the ISS, about {p}% of the dose comes from neutrons, which are hard to shield.', {
              p: Math.round(ISS_NEUTRON_SHARE * 100),
            })}
          </li>
          <li>{t("The Watch and Act bands (50% and 80% of the limit) are this app's choice.")}</li>
        </ul>
        <h2 className="label mt-4">{t('Based on')}</h2>
        <SourceList sourceIds={RADIATION_SOURCE_IDS} />
        <p className="mt-3 text-xs text-ink-faint">
          {t('An estimate for self-awareness. Official dose records come from the radiation team.')}
        </p>
      </section>
    </div>
  )
}

function CareerBar({ careerMSv }: { careerMSv: number }) {
  const share = Math.min(1, careerMSv / CAREER_LIMIT_MSV)
  const status = careerMSv >= CAREER_LIMIT_MSV * 0.8 ? 'alert' : careerMSv >= CAREER_LIMIT_MSV * 0.5 ? 'watch' : 'ok'
  const fill = { ok: 'bg-ok', watch: 'bg-watch', alert: 'bg-alert' }[status]
  const t = useT()
  return (
    <div className="mt-5">
      <div className="flex justify-between text-xs text-ink-dim">
        <span>{t('Career total')}</span>
        <span className="tabular-nums">
          {t('{n} of {limit} mSv ({p}%)', {
            n: Math.round(careerMSv),
            limit: CAREER_LIMIT_MSV,
            p: Math.round((careerMSv / CAREER_LIMIT_MSV) * 100),
          })}
        </span>
      </div>
      <div
        className="relative mt-2 h-3 overflow-hidden rounded-full bg-white/8"
        role="meter"
        aria-label={t('Career radiation dose')}
        aria-valuemin={0}
        aria-valuemax={CAREER_LIMIT_MSV}
        aria-valuenow={Math.round(careerMSv)}
      >
        <motion.div
          className={`h-full rounded-full ${fill}`}
          initial={{ width: '0%' }}
          animate={{ width: `${Math.max(1.5, share * 100)}%` }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        />
        <span className="absolute inset-y-0 left-1/2 w-px bg-watch/70" aria-hidden />
        <span className="absolute inset-y-0 left-[80%] w-px bg-alert/70" aria-hidden />
      </div>
    </div>
  )
}

function RateRow() {
  const { locationId, solar } = useSettings()
  const expected = expectedRate(locationId, solar)
  const t = useT()
  return (
    <div className="mt-2 flex items-baseline justify-between gap-3">
      <p>
        <span className="text-3xl font-semibold tabular-nums">{expected}</span>
        <span className="ml-1.5 text-sm text-ink-dim">{t('mSv/day expected')}</span>
        <span className="block text-xs text-ink-dim">
          {t('{low} to {high} over the solar cycle', { low: DOSE_RATE[locationId].max, high: DOSE_RATE[locationId].min })}
        </span>
      </p>
      <p className="text-right text-xs text-ink-dim">
        {t(SOLAR_LABEL[solar].name)}
        <br />
        {t('{n}× Earth background', { n: Math.round(expected / EARTH_PER_DAY) })}
      </p>
    </div>
  )
}

function StormProtocol() {
  const [open, setOpen] = useState(false)
  const locationId = useSettings((s) => s.locationId)
  const t = useT()
  return (
    <section className="rounded-3xl border border-watch/40 bg-watch/8 p-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-12 w-full items-center gap-3 text-left"
      >
        <ShieldAlert size={24} className="text-watch" aria-hidden />
        <span className="flex-1">
          <span className="block font-semibold">{t('Solar storm alert?')}</span>
          <span className="block text-sm text-ink-dim">{t('What to do in the next minutes')}</span>
        </span>
        <span className="text-sm text-watch">{open ? t('Hide') : t('Show')}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <ol className="space-y-3">
            {STORM_STEPS.map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-watch/20 text-sm font-semibold text-watch">
                  {i + 1}
                </span>
                <span className="pt-0.5 leading-snug">{t(step)}</span>
              </li>
            ))}
          </ol>
          <p className="text-sm text-ink-dim">
            <span className="font-medium text-ink">{t('Expected dose here:')} </span>
            {t(STORM_DOSE[locationId])} {t("NASA's limit for one storm is {n} mSv.", { n: SPE_LIMIT_MSV })}
          </p>
        </div>
      )}
    </section>
  )
}

function DoseLogger({ suggested }: { suggested?: number }) {
  const [text, setText] = useState('')
  const t = useT()
  const value = parseField(DOSE_FIELD, text)
  const field = { ...DOSE_FIELD, start: suggested !== undefined ? Math.round(suggested * 10) / 10 : 0 }
  return (
    <section className="panel space-y-4 rounded-3xl p-5">
      <div>
        <h2 className="label">{t('Log your dosimeter')}</h2>
        <p className="mt-1 text-sm text-ink-dim">
          {t('Read the total mission dose on your active dosimeter. Once a week, and after any solar storm.')}
        </p>
      </div>
      <NumberField field={field} unit="mSv" value={text} onChange={setText} />
      <button
        type="button"
        disabled={value === undefined}
        onClick={() => value !== undefined && void addDose(value)}
        className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-ink font-semibold text-space disabled:opacity-40"
      >
        {t('Save reading')}
      </button>
    </section>
  )
}

function MissionSetup() {
  const { missionStart, priorDoseMSv, solar, setMission } = useSettings()
  const [prior, setPrior] = useState(String(priorDoseMSv))
  const t = useT()

  return (
    <section className="panel space-y-5 rounded-3xl p-5">
      <h2 className="label">{t('Your mission')}</h2>
      <div>
        <label htmlFor="mission-start" className="label">
          {t('Mission start')}
        </label>
        <input
          id="mission-start"
          type="date"
          value={toDateInput(missionStart)}
          onChange={(e) =>
            setMission({ missionStart: e.target.value ? new Date(`${e.target.value}T00:00`).getTime() : null })
          }
          className="panel mt-2 h-14 w-full rounded-2xl px-4 text-lg [color-scheme:dark]"
        />
      </div>
      <NumberField
        field={PRIOR_FIELD}
        unit="mSv"
        value={prior}
        onChange={(t) => {
          setPrior(t)
          const n = parseField(PRIOR_FIELD, t)
          if (n !== undefined) setMission({ priorDoseMSv: n })
        }}
      />
      <div>
        <p className="label">{t('Solar activity')}</p>
        <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('Solar activity')}>
          {(Object.keys(SOLAR_LABEL) as SolarActivity[]).map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={solar === s}
              onClick={() => setMission({ solar: s })}
              className={`flex min-h-16 flex-col items-start justify-center rounded-2xl border px-3 text-left ${
                solar === s ? 'border-accent/60 bg-accent/10' : 'border-line'
              }`}
            >
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Sun size={14} className={solar === s ? 'text-accent' : 'text-ink-dim'} aria-hidden />
                {t(SOLAR_LABEL[s].name)}
              </span>
              <span className="text-xs text-ink-dim">{t(SOLAR_LABEL[s].note)}</span>
            </button>
          ))}
        </div>
      </div>
      <p className="flex items-center gap-2 text-xs text-ink-faint">
        <StatusIcon status="ok" size={12} /> {t('Saved on this device.')}
      </p>
    </section>
  )
}
