import '@fontsource-variable/inter'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import './index.css'

import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { initScroll } from './lib/scroll'

// Lenis must exist before any component creates a ScrollTrigger.
initScroll()

const root = document.getElementById('root')
if (!root) throw new Error('#root element missing')

// Intentionally no <StrictMode>: its double-invoked effects would build every
// GSAP timeline twice and fire intro sounds twice in development.
createRoot(root).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)
