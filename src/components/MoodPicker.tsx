import { Annoyed, Frown, Laugh, Meh, Smile } from 'lucide-react'
import { useT } from '../i18n'
import { msg } from '../i18n/msg'

const FACES = [
  { score: 1, label: msg('Very low'), icon: Frown },
  { score: 2, label: msg('Low'), icon: Annoyed },
  { score: 3, label: msg('Neutral'), icon: Meh },
  { score: 4, label: msg('Good'), icon: Smile },
  { score: 5, label: msg('Great'), icon: Laugh },
]

export function MoodPicker({ value, onChange }: { value?: number; onChange: (score: number) => void }) {
  const t = useT()
  return (
    <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label={t('Mood')}>
      {FACES.map(({ score, label, icon: Icon }) => {
        const active = value === score
        return (
          <button
            key={score}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(score)}
            className={`flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border ${
              active ? 'border-accent/60 bg-panel-2 text-accent' : 'border-line bg-panel text-ink-dim'
            }`}
          >
            <Icon size={30} strokeWidth={1.5} aria-hidden />
            <span className="text-[0.6875rem] font-medium">{t(label)}</span>
          </button>
        )
      })}
    </div>
  )
}
