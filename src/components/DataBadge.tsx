import { useT } from '../i18n'
import { DATA_KIND, type DataKind } from '../data/dataKinds'

export function DataBadge({ kind }: { kind: DataKind }) {
  const t = useT()
  const { label, note, icon: Icon, className } = DATA_KIND[kind]
  return (
    <span
      title={t(note)}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${className}`}
    >
      <Icon size={11} aria-hidden />
      {t(label)}
    </span>
  )
}
