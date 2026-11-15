import { MotionConfig } from 'motion/react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { Alerts } from './screens/Alerts'
import { BodyMap } from './screens/BodyMap'
import { Crew } from './screens/Crew'
import { Scenarios } from './screens/Scenarios'
import { DeviceStage, DeviceSwitcher } from './components/DevicePreview'
import { IntroSplash } from './components/IntroSplash'
import { useDesktopWeb, usePreview } from './lib/devicePreview'
import { finishIntro, useIntro } from './lib/intro'
import { Exercise } from './screens/Exercise'
import { Hazards } from './screens/Hazards'
import { Home } from './screens/Home'
import { Measure } from './screens/Measure'
import { Mind } from './screens/Mind'
import { Radiation } from './screens/Radiation'
import { Report } from './screens/Report'
import { Routine } from './screens/Routine'
import { Sounds } from './screens/Sounds'
import { Sources } from './screens/Sources'
import { Symptoms } from './screens/Symptoms'
import { Trends } from './screens/Trends'

export default function App() {
  // In a desktop browser, a menu lets judges and testers see the phone and tablet layouts.
  const desktop = useDesktopWeb()
  const [preview, setPreview] = usePreview()
  const mode = desktop ? preview.mode : 'web'
  // The opening animation plays every time the app starts (inside the device frame when previewing).
  const introDone = useIntro((s) => s.done)

  return (
    <MotionConfig reducedMotion="user">
      {mode === 'web' ? (
        <>
          <HashRouter>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<Home />} />
                <Route path="routine" element={<Routine />} />
                <Route path="measure" element={<Measure />} />
                <Route path="mind" element={<Mind />} />
                <Route path="symptoms" element={<Symptoms />} />
                <Route path="exercise" element={<Exercise />} />
                <Route path="sounds" element={<Sounds />} />
                <Route path="trends" element={<Trends />} />
                <Route path="sources" element={<Sources />} />
                <Route path="hazards" element={<Hazards />} />
                <Route path="radiation" element={<Radiation />} />
                <Route path="alerts" element={<Alerts />} />
                <Route path="report" element={<Report />} />
                <Route path="body" element={<BodyMap />} />
                <Route path="crew" element={<Crew />} />
                <Route path="scenarios" element={<Scenarios />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </HashRouter>
          {!introDone && <IntroSplash onDone={finishIntro} />}
          {desktop && introDone && (
            <DeviceSwitcher state={preview} onChange={setPreview} className="fixed left-1/2 top-3 z-[60] -translate-x-1/2" />
          )}
        </>
      ) : (
        <DeviceStage state={{ ...preview, mode }} onChange={setPreview} />
      )}
    </MotionConfig>
  )
}
