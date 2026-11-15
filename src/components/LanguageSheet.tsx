import { Check, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { LANGUAGES, useT } from '../i18n'
import { useSettings } from '../lib/store'

/** Bottom sheet to pick the interface language. Each language is listed in its own script. */
export function LanguageSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { language, setLanguage } = useSettings()
  const t = useT()

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center">
          <motion.div
            className="absolute inset-0 bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t('Language')}
            className="glass glass-sheet relative w-full max-w-md rounded-t-[32px] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:rounded-[32px]"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="label">{t('Language')}</p>
                <h2 className="text-xl font-semibold">{t('Choose your language')}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t('Close')}
                className="flex size-12 items-center justify-center rounded-full bg-white/10"
              >
                <X size={20} />
              </button>
            </div>
            <ul className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((l) => {
                const active = l.id === language
                return (
                  <li key={l.id}>
                    <button
                      type="button"
                      lang={l.id}
                      onClick={() => {
                        setLanguage(l.id)
                        onClose()
                      }}
                      aria-pressed={active}
                      className={`flex min-h-16 w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left ${
                        active ? 'border-accent/60 bg-panel-2' : 'border-line bg-panel'
                      }`}
                    >
                      <span className="flex-1">
                        <span className="block font-medium">{l.native}</span>
                        <span className="block text-xs text-ink-dim">{l.english}</span>
                      </span>
                      {active && <Check size={18} className="text-accent" />}
                    </button>
                  </li>
                )
              })}
            </ul>
            <p className="mt-4 text-xs text-ink-faint">
              {t('Translations were made with AI help and have not been reviewed by medical translators.')}
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
