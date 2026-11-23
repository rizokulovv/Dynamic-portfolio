import { Navigate, Route, Routes } from 'react-router-dom'
import { Chrome } from './components/Chrome'
import { CommandPalette } from './components/CommandPalette'
import { CursorTag } from './components/CursorTag'
import { SoundGate } from './components/SoundGate'
import { Transition } from './components/Transition'
import { Home } from './pages/Home'
import { NotFound } from './pages/NotFound'
import { Work } from './pages/Work'

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Transition>
        {(location) => (
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/works" element={<Navigate to={{ pathname: '/', hash: '#works' }} replace />} />
            <Route path="/works/:slug" element={<Work />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        )}
      </Transition>
      <Chrome />
      <CursorTag />
      <CommandPalette />
      <SoundGate />
      <div className="grain" aria-hidden="true" />
    </>
  )
}
