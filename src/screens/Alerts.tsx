import { BellRing, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AlertCard } from '../components/AlertCard'
import { useT } from '../i18n'
import { useAlerts } from '../lib/useAlerts'

export function Alerts() {
  const alerts = useAlerts()
  const t = useT()
  if (!alerts) return null
  const act = alerts.filter((a) => a.status === 'alert').length

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <p className="label">{t('Early warnings')}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t('Patterns in your data')}</h1>
        <p className="mt-2 text-sm text-ink-dim">
          {t(
            'Checked every time you log something: streaks out of range, worsening trends, values heading out of range within a week, and signs that point the same way.',
          )}
        </p>
        {alerts.length > 0 && (
          <p className="mt-3 text-sm">
            {t('Warnings: {n} · Act now: {act}', { n: alerts.length, act })}
          </p>
        )}
      </div>

      {alerts.length === 0 ? (
        <section className="panel flex items-center gap-4 rounded-3xl p-5">
          <BellRing size={24} className="shrink-0 text-ok" aria-hidden />
          <p className="text-sm text-ink-dim">
            {t('No early warnings. Keep logging every day so patterns can be found early.')}
          </p>
        </section>
      ) : (
        alerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)
      )}

      <Link
        to="/report"
        className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-ink font-semibold text-space"
      >
        <FileText size={18} aria-hidden />
        {t('Prepare report for the flight surgeon')}
      </Link>

      <p className="px-1 text-xs text-ink-faint">
        {t(
          "The warning rules are this app's choice, built on the clinical ranges. They support your judgement and the flight surgeon's, and do not replace them.",
        )}
      </p>
    </div>
  )
}
