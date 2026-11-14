import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { Exercise } from './screens/Exercise'
import { Home } from './screens/Home'
import { Measure } from './screens/Measure'
import { Mind } from './screens/Mind'
import { Sounds } from './screens/Sounds'
import { Sources } from './screens/Sources'
import { Symptoms } from './screens/Symptoms'
import { Trends } from './screens/Trends'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="measure" element={<Measure />} />
          <Route path="mind" element={<Mind />} />
          <Route path="symptoms" element={<Symptoms />} />
          <Route path="exercise" element={<Exercise />} />
          <Route path="sounds" element={<Sounds />} />
          <Route path="trends" element={<Trends />} />
          <Route path="sources" element={<Sources />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
