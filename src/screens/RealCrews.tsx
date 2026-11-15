import { ArrowRight, Microscope } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { DataBadge } from '../components/DataBadge'
import { SourceList } from '../components/SourceList'
import { REAL_CASES } from '../data/realCrews'
import { useT } from '../i18n'

/** Published NASA findings from real crews, each linked to the part of Tether that watches for it. */
export function RealCrews() {
  const t = useT()
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <p className="label">{t('Real crews')}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t('What spaceflight did to real crews')}</h1>
        <p className="mt-2 text-sm text-ink-dim">
          {t('Findings NASA has published from real missions. Each one is a reason Tether measures what it does.')}
        </p>
      </div>

      {REAL_CASES.map((c, i) => (
        <motion.section
          key={c.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="panel rounded-3xl p-5"
        >
          <div className="flex items-start justify-between gap-2">
            <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
              <Microscope size={18} className="text-accent" aria-hidden /> {t(c.title)}
            </h2>
            <DataBadge kind="nasa" />
          </div>
          <p className="mt-1 text-sm text-ink-dim">{t(c.mission)}</p>
          <ul className="mt-4 space-y-3">
            {c.findings.map((f) => (
              <li key={f.text} className="border-l-2 border-accent/40 pl-3">
                <p className="text-sm">{t(f.text)}</p>
                <Link to={f.link} className="mt-1 inline-flex items-center gap-1 text-xs text-accent">
                  {t('Tether: {screen}', { screen: t(f.linkLabel) })} <ArrowRight size={12} aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
          <SourceList sourceIds={c.sourceIds} />
        </motion.section>
      ))}
    </div>
  )
}
