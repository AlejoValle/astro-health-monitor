import { ChevronRight, Languages } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { locationById } from '../data/locations'
import { LANGUAGES, useT } from '../i18n'
import { useIntro } from '../lib/intro'
import { useSettings } from '../lib/store'
import { warp } from '../lib/warp'
import { getActiveProfileId, useProfiles } from '../lib/profiles'
import { Avatar } from './Avatar'
import { BottomNav } from './BottomNav'
import { LanguageSheet } from './LanguageSheet'
import { MasterCaution } from './MasterCaution'
import { LOCATION_ICON, LocationSheet } from './LocationSheet'
import { ProgressToast } from './ProgressToast'
import { SpaceBackdrop } from './SpaceBackdrop'

export function AppShell() {
  const locationId = useSettings((s) => s.locationId)
  const location = locationById(locationId)
  const LocationIcon = LOCATION_ICON[locationId]
  const [sheetOpen, setSheetOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const language = useSettings((s) => s.language)
  const t = useT()
  const profiles = useProfiles()
  const profile = profiles.find((p) => p.id === getActiveProfileId()) ?? profiles[0]
  const { pathname } = useLocation()
  const introDone = useIntro((s) => s.done)

  // A short jump to warp on every screen change, and when the mission location changes.
  useEffect(() => {
    warp()
  }, [pathname, locationId])

  // Screen readers and fonts follow the chosen language.
  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  return (
    <>
      <SpaceBackdrop />
      <div className="relative z-10 mx-auto min-h-full w-full max-w-md px-4 pb-32 pt-[max(1rem,env(safe-area-inset-top))] md:max-w-2xl lg:max-w-5xl lg:pb-10 lg:pl-32">
        <header className="page-header mb-5 flex items-center justify-between gap-3">
          <Link to="/crew" className="press flex min-w-0 items-center gap-2.5" aria-label={t('Crew')}>
            <Avatar profile={profile} size={36} />
            <span className="min-w-0">
              <span className="label block">Tether</span>
              <span className="block truncate text-sm text-ink-dim" title={t(location.gravity)}>
                {profile.name}
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLanguageOpen(true)}
              aria-label={t('Language')}
              title={t('Language')}
              className="glass press flex min-h-12 items-center gap-1.5 rounded-full px-3 text-sm font-medium"
            >
              <Languages size={18} strokeWidth={1.75} className="text-accent" aria-hidden />
              <span className="uppercase">{LANGUAGES.find((l) => l.id === language)?.id}</span>
            </button>
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="glass press flex min-h-12 items-center gap-2 rounded-full py-2 pl-3 pr-2 text-sm font-medium"
            >
              <LocationIcon size={18} strokeWidth={1.75} className="text-accent" aria-hidden />
              {t(location.name)}
              <ChevronRight size={16} className="text-ink-dim" aria-hidden />
            </button>
          </div>
        </header>

        <MasterCaution />

        <main>
          {/* Keyed by route, and by the intro, so each screen plays its entrance when it is first seen. */}
          <div key={`${pathname}-${introDone}`} className="page">
            <Outlet />
          </div>
        </main>

        <BottomNav />
        <ProgressToast />
        <LocationSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
        <LanguageSheet open={languageOpen} onClose={() => setLanguageOpen(false)} />
      </div>
    </>
  )
}
