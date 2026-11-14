import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { locationById } from '../data/locations'
import { useSettings } from '../lib/store'
import { BottomNav } from './BottomNav'
import { LOCATION_ICON, LocationSheet } from './LocationSheet'

export function AppShell() {
  const locationId = useSettings((s) => s.locationId)
  const location = locationById(locationId)
  const LocationIcon = LOCATION_ICON[locationId]
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <div className="mx-auto min-h-full w-full max-w-md px-4 pb-32 pt-[max(1rem,env(safe-area-inset-top))] md:max-w-2xl lg:max-w-5xl lg:pb-10 lg:pl-32">
      <header className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="label">AstroVitals</p>
          <p className="text-sm text-ink-dim">{location.gravity}</p>
        </div>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="glass flex min-h-12 items-center gap-2 rounded-full py-2 pl-3 pr-2 text-sm font-medium"
        >
          <LocationIcon size={18} strokeWidth={1.75} className="text-accent" aria-hidden />
          {location.name}
          <ChevronRight size={16} className="text-ink-dim" aria-hidden />
        </button>
      </header>

      <main>
        <Outlet />
      </main>

      <BottomNav />
      <LocationSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}
