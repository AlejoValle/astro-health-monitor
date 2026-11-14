import Dexie from 'dexie'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDownRight, ArrowRight, ArrowUpRight, FlaskConical } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { INDICATOR_ICON } from '../components/IndicatorCard'
import { StatusPill } from '../components/status'
import { INDICATORS, indicatorById, type IndicatorId } from '../data/indicators'
import { db } from '../lib/db'
import { assess, formatValue, type Status } from '../lib/rules'
import { direction, MIN_CHANGE, OK_RANGES, type Direction } from '../lib/trends'

const MAX_READINGS = 30
const STATUS_COLOR: Record<Status, string> = {
  ok: 'var(--color-ok)',
  watch: 'var(--color-watch)',
  alert: 'var(--color-alert)',
}
const LINE_COLOR = ['var(--color-accent)', '#a5b4fc']
const DIRECTION: Record<Direction, { icon: typeof ArrowRight; text: string }> = {
  up: { icon: ArrowUpRight, text: 'Going up' },
  down: { icon: ArrowDownRight, text: 'Going down' },
  steady: { icon: ArrowRight, text: 'Steady' },
}

const day = (at: number) => new Date(at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const isIndicatorId = (id: string | null): id is IndicatorId => INDICATORS.some((i) => i.id === id)

export function Trends() {
  const [params] = useSearchParams()
  const requested = params.get('i')
  const id: IndicatorId = isIndicatorId(requested) ? requested : 'hr'
  const indicator = indicatorById(id)
  const loaded = useLiveQuery(
    async () => ({
      id,
      readings: (
        await db.readings
          .where('[indicatorId+at]')
          .between([id, Dexie.minKey], [id, Dexie.maxKey])
          .reverse()
          .limit(MAX_READINGS)
          .toArray()
      ).reverse(),
    }),
    [id],
  )
  // useLiveQuery keeps the previous indicator's result until the new query resolves.
  const readings = loaded?.id === id ? loaded.readings : undefined

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <p className="label">Trends</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{indicator.name}</h1>
      </div>

      <nav aria-label="Indicator" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {INDICATORS.map((i) => {
          const Icon = INDICATOR_ICON[i.id]
          const active = i.id === id
          return (
            <Link
              key={i.id}
              to={`/trends?i=${i.id}`}
              replace
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-12 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium ${
                active ? 'border-accent/60 bg-accent/10' : 'border-line bg-panel text-ink-dim'
              }`}
            >
              <Icon size={16} aria-hidden />
              {i.short}
            </Link>
          )
        })}
      </nav>

      {readings && readings.length === 0 && (
        <section className="panel rounded-3xl p-6">
          <p className="text-ink-dim">No readings yet.</p>
          <Link
            to={`/measure?i=${id}`}
            className="mt-4 flex min-h-14 items-center justify-center rounded-2xl bg-ink font-semibold text-space"
          >
            Measure now
          </Link>
        </section>
      )}

      {readings && readings.length > 0 && <TrendBody key={id} id={id} readings={readings} />}
    </div>
  )
}

interface Row {
  at: number
  values: number[]
  origin: string
  status: Status
}

function TrendBody({ id, readings }: { id: IndicatorId; readings: Omit<Row, 'status'>[] }) {
  const indicator = indicatorById(id)
  const ranges = OK_RANGES[id]
  const rows: Row[] = readings.map((r) => ({ ...r, status: assess(id, r.values).status }))
  const outside = rows.filter((r) => r.status !== 'ok').length
  const trend = direction(rows.map((r) => r.values[0]), MIN_CHANGE[id])
  const simulated = rows.some((r) => r.origin === 'simulated')

  const all = rows.flatMap((r) => r.values)
  const edges = ranges.flatMap((r) => [r.min, r.max]).filter((v): v is number => v !== undefined)
  const low = Math.min(...all, ...edges)
  const high = Math.max(...all, ...edges)
  const pad = Math.max((high - low) * 0.15, indicator.fields[0].step)
  const domain = [Math.floor(low - pad), Math.ceil(high + pad)]
  const Trend = trend && DIRECTION[trend]

  return (
    <>
      <section className="panel rounded-3xl p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
          <p className="flex items-center gap-2 text-lg font-semibold">
            {Trend ? (
              <>
                <Trend.icon size={20} className="text-accent" aria-hidden />
                {Trend.text}
              </>
            ) : (
              <span className="text-base font-normal text-ink-dim">Add 6 readings to see a trend</span>
            )}
          </p>
          {simulated && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-ink-dim">
              <FlaskConical size={12} aria-hidden />
              Simulated data
            </span>
          )}
        </div>
        <div className="h-56" role="img" aria-label={`${indicator.name} over the last ${rows.length} readings`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
              <CartesianGrid stroke="var(--color-line)" vertical={false} />
              <XAxis
                dataKey="at"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={day}
                tick={{ fill: 'var(--color-ink-dim)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                minTickGap={40}
              />
              <YAxis
                domain={domain}
                tick={{ fill: 'var(--color-ink-dim)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={indicator.fields[0].step < 1}
              />
              {ranges.length === 1 ? (
                <ReferenceArea
                  y1={ranges[0].min ?? domain[0]}
                  y2={ranges[0].max ?? domain[1]}
                  fill="var(--color-ok)"
                  fillOpacity={0.1}
                  stroke="none"
                />
              ) : (
                // One shared band would be wrong for two numbers with different limits.
                ranges.map((range, field) => (
                  <ReferenceLine
                    key={field}
                    y={range.max ?? range.min}
                    stroke={LINE_COLOR[field]}
                    strokeOpacity={0.7}
                    strokeDasharray="4 4"
                  />
                ))
              )}
              {indicator.fields.map((f, field) => (
                <Line
                  key={f.key}
                  dataKey={(row: Row) => row.values[field]}
                  stroke={LINE_COLOR[field]}
                  strokeWidth={2}
                  isAnimationActive={false}
                  dot={({ cx, cy, index, payload }: { cx?: number; cy?: number; index?: number; payload?: Row }) => (
                    <circle
                      key={index}
                      cx={cx}
                      cy={cy}
                      r={3.5}
                      fill={payload ? STATUS_COLOR[payload.status] : 'var(--color-ink-dim)'}
                      stroke="var(--color-panel)"
                    />
                  )}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 px-1 text-sm text-ink-dim">
          {ranges.length === 1 ? (
            <>
              <span className="mr-1.5 inline-block size-2.5 rounded-sm bg-ok/40 align-middle" aria-hidden />
              Green band: OK range.
            </>
          ) : (
            'Dashed lines: top of the OK range for each number.'
          )}{' '}
          {outside} of {rows.length} readings were outside it.
        </p>
      </section>

      <section className="panel rounded-3xl p-5">
        <h2 className="label">Latest readings</h2>
        <ul className="mt-2 divide-y divide-line">
          {rows
            .slice(-5)
            .reverse()
            .map((r) => (
              <li key={r.at} className="flex min-h-12 items-center gap-3 py-2">
                <span className="w-16 text-sm text-ink-dim">{day(r.at)}</span>
                <span className="flex-1 whitespace-nowrap font-semibold tabular-nums">
                  {formatValue(id, r.values)} <span className="text-sm font-normal text-ink-dim">{indicator.unit}</span>
                </span>
                <StatusPill status={r.status} label={assess(id, r.values).label} />
              </li>
            ))}
        </ul>
        <Link
          to={`/measure?i=${id}`}
          className="mt-4 flex min-h-14 items-center justify-center rounded-2xl bg-ink font-semibold text-space"
        >
          Measure now
        </Link>
      </section>
    </>
  )
}
