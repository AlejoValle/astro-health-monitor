import { Brain, Dumbbell, House, ListChecks, Plus, Stethoscope } from 'lucide-react'
import { motion } from 'motion/react'
import { NavLink } from 'react-router-dom'
import { useT } from '../i18n'
import { msg } from '../i18n/msg'

const ITEMS = [
  { to: '/', label: msg('Home'), icon: House },
  { to: '/routine', label: msg('Routine'), icon: ListChecks },
  { to: '/measure', label: msg('Measure'), icon: Plus },
  { to: '/mind', label: msg('Mind'), icon: Brain },
  { to: '/symptoms', label: msg('Symptoms'), icon: Stethoscope },
  { to: '/exercise', label: msg('Exercise'), icon: Dumbbell },
]

export function BottomNav() {
  const t = useT()
  return (
    <nav
      aria-label={t('Main')}
      className="glass fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md rounded-[28px] p-1.5 lg:inset-x-auto lg:bottom-auto lg:left-4 lg:top-1/2 lg:w-24 lg:-translate-y-1/2 lg:flex-col"
    >
      {ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className="relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-[22px] text-[11px] font-medium lg:min-h-18"
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-[22px] bg-white/14"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <Icon
                size={22}
                strokeWidth={1.75}
                className={`relative ${isActive ? 'text-ink' : 'text-ink-dim'}`}
                aria-hidden
              />
              <span className={`relative ${isActive ? 'text-ink' : 'text-ink-dim'}`}>{t(label)}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
