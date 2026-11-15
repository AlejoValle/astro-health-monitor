import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// When a new version's service worker takes over a page that was already running an older
// version, reload once so the crew member sees the new screens instead of a stale copy.
// On the very first visit there is no previous controller, so nothing reloads.
if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return
    reloading = true
    window.location.reload()
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
