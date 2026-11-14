import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { ComingSoon } from './screens/ComingSoon'
import { Home } from './screens/Home'
import { Measure } from './screens/Measure'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="measure" element={<Measure />} />
          <Route path="mind" element={<ComingSoon title="Mind check" />} />
          <Route path="symptoms" element={<ComingSoon title="Symptoms" />} />
          <Route path="exercise" element={<ComingSoon title="Exercise" />} />
          <Route path="sounds" element={<ComingSoon title="Sounds" />} />
          <Route path="sources" element={<ComingSoon title="Sources" />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
