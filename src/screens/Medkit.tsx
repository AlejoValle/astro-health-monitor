import { Minus, Plus, Pill, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { SourceList } from '../components/SourceList'
import { StatusIcon } from '../components/status'
import { useLocale, useT } from '../i18n'
import { itemStatus, useMedkit, type KitItem } from '../lib/medkit'
import { worst, type Status } from '../lib/rules'
import { STATUS_STYLE } from '../lib/statusStyle'
import { useNow } from '../lib/useRecords'

const RANK: Record<Status, number> = { alert: 0, watch: 1, ok: 2 }

const toMonthInput = (ts: number) => {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
/** Medicines expire at the end of the printed month. */
const fromMonthInput = (v: string) => {
  const [y, m] = v.split('-').map(Number)
  return new Date(y, m, 0, 23, 59).getTime()
}

/** The shared medical kit: what is on board, how many are left and when each one expires. */
export function Medkit() {
  const t = useT()
  const now = useNow()
  const { items, use, update, add, remove, reset } = useMedkit()
  const [adding, setAdding] = useState(false)

  const rows = items
    .map((item) => ({ item, s: itemStatus(item, now) }))
    .sort((a, b) => RANK[a.s.status] - RANK[b.s.status] || a.item.expires - b.item.expires)
  const overall = worst(rows.map((r) => r.s.status))
  const issues = rows.filter((r) => r.s.status !== 'ok').length

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <p className="label">{t('Medical kit')}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t('What is on board')}</h1>
        <p className="mt-2 text-sm text-ink-dim">
          {t('There is no pharmacy on the way to Mars. Keep count of what is left and what expires before the mission ends. The kit is shared by the whole crew on this device.')}
        </p>
      </div>

      <section className={`panel rounded-3xl border p-4 ${STATUS_STYLE[overall].ring}`}>
        <p className="flex items-center gap-2 font-medium">
          <StatusIcon status={overall} size={18} />
          {issues === 0 ? t('Everything is in date and in stock.') : t('{n} items need attention.', { n: issues })}
        </p>
        <p className="mt-2 text-xs text-ink-dim">
          {t('A NASA study found that medicines kept in space for longer fell short of their strength more often, regardless of the date on the label.')}
        </p>
        <SourceList sourceIds={['nasa-pharma']} />
      </section>

      <ul className="space-y-2">
        {rows.map(({ item, s }) => (
          <li key={item.id}>
            <KitRow item={item} status={s.status} label={s.label} onUse={() => use(item.id)} onUpdate={(p) => update(item.id, p)} onRemove={() => remove(item.id)} />
          </li>
        ))}
      </ul>

      {adding ? (
        <AddItem
          onCancel={() => setAdding(false)}
          onAdd={(item) => {
            add(item)
            setAdding(false)
          }}
        />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setAdding(true)} className="panel flex min-h-12 items-center justify-center gap-2 rounded-2xl text-sm font-medium">
            <Plus size={16} aria-hidden /> {t('Add an item')}
          </button>
          <button
            type="button"
            onClick={() => window.confirm(t('Replace the kit with the example list?')) && reset()}
            className="panel flex min-h-12 items-center justify-center gap-2 rounded-2xl text-sm text-ink-dim"
          >
            <RotateCcw size={16} aria-hidden /> {t('Example kit')}
          </button>
        </div>
      )}

      <p className="text-xs text-ink-faint">
        {t('An example list by purpose, with no doses. Always follow the flight surgeon’s kit list and instructions before taking any medicine.')}
      </p>
    </div>
  )
}

function KitRow(props: {
  item: KitItem
  status: Status
  label: string
  onUse: () => void
  onUpdate: (patch: Partial<KitItem>) => void
  onRemove: () => void
}) {
  const t = useT()
  const locale = useLocale()
  const { item } = props
  const [open, setOpen] = useState(false)
  return (
    <article className={`panel rounded-2xl p-4 ${props.status !== 'ok' ? STATUS_STYLE[props.status].ring : ''}`}>
      <div className="flex items-center gap-3">
        <Pill size={20} strokeWidth={1.5} className="shrink-0 text-accent" aria-hidden />
        <button type="button" onClick={() => setOpen((o) => !o)} className="min-w-0 flex-1 text-left" aria-expanded={open}>
          <span className="block font-medium">{t(item.name)}</span>
          <span className="block text-xs text-ink-dim">
            {t(item.purpose)} · {t('expires {date}', { date: new Date(item.expires).toLocaleDateString(locale, { month: 'short', year: 'numeric' }) })}
          </span>
        </button>
        <span className="text-right">
          <span className="block text-lg font-semibold tabular-nums">{item.count}</span>
          <span className={`flex items-center justify-end gap-1 text-[11px] ${STATUS_STYLE[props.status].text}`}>
            <StatusIcon status={props.status} size={11} /> {t(props.label)}
          </span>
        </span>
      </div>
      {open && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <button type="button" onClick={props.onUse} disabled={item.count === 0} className="inline-flex min-h-10 items-center gap-1 rounded-full bg-ink px-3 text-sm font-semibold text-space disabled:opacity-40">
            <Minus size={14} aria-hidden /> {t('Use one')}
          </button>
          <button type="button" onClick={() => props.onUpdate({ count: item.count + 1 })} className="inline-flex min-h-10 items-center gap-1 rounded-full border border-line px-3 text-sm" aria-label={t('Add one')}>
            <Plus size={14} aria-hidden />
          </button>
          <label className="inline-flex items-center gap-2 text-sm text-ink-dim">
            {t('Expires')}
            <input
              type="month"
              value={toMonthInput(item.expires)}
              onChange={(e) => e.target.value && props.onUpdate({ expires: fromMonthInput(e.target.value) })}
              className="rounded-lg border border-line bg-panel-2 px-2 py-1 text-ink"
            />
          </label>
          <button type="button" onClick={props.onRemove} className="ml-auto inline-flex min-h-10 items-center gap-1 px-2 text-sm text-ink-dim" aria-label={t('Remove')}>
            <Trash2 size={14} aria-hidden />
          </button>
        </div>
      )}
    </article>
  )
}

function AddItem({ onAdd, onCancel }: { onAdd: (item: Omit<KitItem, 'id'>) => void; onCancel: () => void }) {
  const t = useT()
  const [name, setName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [count, setCount] = useState('10')
  const [month, setMonth] = useState('')
  const valid = name.trim() && Number(count) >= 0 && month
  const input = 'w-full rounded-xl border border-line bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent/60'
  return (
    <section className="panel space-y-3 rounded-3xl p-5">
      <input className={input} placeholder={t('Name')} value={name} onChange={(e) => setName(e.target.value)} aria-label={t('Name')} />
      <input className={input} placeholder={t('What it is for')} value={purpose} onChange={(e) => setPurpose(e.target.value)} aria-label={t('What it is for')} />
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-ink-dim">
          {t('How many')}
          <input className={`${input} mt-1`} inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} />
        </label>
        <label className="text-xs text-ink-dim">
          {t('Expires')}
          <input className={`${input} mt-1`} type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </label>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="min-h-12 flex-1 rounded-2xl border border-line text-sm">
          {t('Cancel')}
        </button>
        <button
          type="button"
          disabled={!valid}
          onClick={() => onAdd({ name: name.trim(), purpose: purpose.trim(), count: Math.round(Number(count)), expires: fromMonthInput(month) })}
          className="min-h-12 flex-1 rounded-2xl bg-ink text-sm font-semibold text-space disabled:opacity-40"
        >
          {t('Add')}
        </button>
      </div>
    </section>
  )
}
