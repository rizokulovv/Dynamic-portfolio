import { useEffect, useRef, useState, useSyncExternalStore, type MouseEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { site, type SectionId } from '../data/site'
import { emit, getIntroState, on, subscribeIntro } from '../lib/bus'
import { gsap, useGoTo } from '../lib/scroll'
import { play, toggleSound, useSoundEnabled } from '../lib/sound'

type Tone = 'light' | 'dark' | 'violet'

/** Which [data-hud] region sits under a viewport point? Last (deepest) match wins. */
function toneAt(x: number, y: number): Tone {
  let tone: Tone = 'light'
  document.querySelectorAll<HTMLElement>('[data-hud]').forEach((node) => {
    const r = node.getBoundingClientRect()
    if (r.height > 0 && r.top <= y && r.bottom > y && r.left <= x && r.right > x) tone = (node.dataset.hud as Tone) || tone
  })
  return tone
}

const CORNERS = ['tl', 'tr', 'bl', 'br'] as const

const pad = (n: number) => String(n).padStart(2, '0')
const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent)

/**
 * Fixed HUD: brand, navigation, live timecode and sound toggle. Each corner
 * samples the section beneath it, so colours adapt to dark/light/violet areas.
 */
export function Chrome() {
  const rootRef = useRef<HTMLDivElement>(null)
  const timeRef = useRef<HTMLSpanElement>(null)
  const sound = useSoundEnabled()
  const goTo = useGoTo()
  const location = useLocation()
  const intro = useSyncExternalStore(subscribeIntro, getIntroState) === 'playing'
  const [toast, setToast] = useState<string | null>(null)

  // Live timecode MM:SS:FF (30 fps) — written straight to the DOM, no re-renders.
  useEffect(() => {
    const start = performance.now()
    let last = ''
    const tick = () => {
      const t = (performance.now() - start) / 1000
      const value = `${pad(Math.floor(t / 60) % 100)}:${pad(Math.floor(t) % 60)}:${pad(Math.floor((t % 1) * 30))}`
      if (value !== last && timeRef.current) {
        timeRef.current.textContent = value
        last = value
      }
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])

  // Adaptive colours.
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const el = rootRef.current
      if (!el) return
      // Each HUD cluster samples the region under its own centre.
      CORNERS.forEach((corner) => {
        const node = el.querySelector<HTMLElement>(`[data-corner="${corner}"]`)
        if (!node) return
        const r = node.getBoundingClientRect()
        const tone = toneAt(r.left + r.width / 2, r.top + r.height / 2)
        if (el.dataset[corner] !== tone) el.dataset[corner] = tone
      })
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    const off = on('hud:refresh', schedule)
    const settle = window.setTimeout(schedule, 900)
    schedule()
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      off()
      cancelAnimationFrame(raf)
      window.clearTimeout(settle)
    }
  }, [location.pathname])

  useEffect(() => {
    let timer = 0
    const off = on('toast', (message) => {
      setToast(message)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setToast(null), 2200)
    })
    return () => {
      off()
      window.clearTimeout(timer)
    }
  }, [])

  const navigate = (id: SectionId) => (e: MouseEvent) => {
    e.preventDefault()
    play('tick', { volume: 0.6 })
    goTo(id)
  }

  return (
    <div ref={rootRef} className={`hud${intro ? ' is-intro' : ''}`} data-tl="light" data-tr="light" data-bl="light" data-br="light">
      <header className="hud__top">
        <Link to="/" className="hud__brand" data-corner="tl" onClick={location.pathname === '/' ? navigate('top') : undefined} aria-label={`${site.brand} — home`}>
          {site.brand} <span className="hud__heart" aria-hidden="true">♥</span>
        </Link>
        <nav className="hud__nav" data-corner="tr" aria-label="Primary">
          <ul>
            {site.nav.map((item) => (
              <li key={item.id} className="hud__link">
                <a href={`/#${item.id}`} onClick={navigate(item.id)}>
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <button
                type="button"
                className="hud__kbd"
                onClick={() => emit('palette:open')}
                aria-label={`Open command palette (${isMac ? '⌘' : 'Ctrl'} + K)`}
                aria-keyshortcuts={isMac ? 'Meta+K' : 'Control+K'}
              >
                <span className="hud__menu-label">{site.hud.menu}</span>
                <kbd>{isMac ? '⌘K' : 'Ctrl K'}</kbd>
              </button>
            </li>
          </ul>
        </nav>
      </header>

      <div className="hud__bottom">
        <span className="hud__time" data-corner="bl" aria-hidden="true">
          <span className="hud__rec" />
          <span ref={timeRef}>00:00:00</span>
        </span>
        <div className="hud__right" data-corner="br">
          <button
            type="button"
            className={`hud__sound${sound ? ' is-on' : ''}`}
            aria-pressed={sound}
            onClick={toggleSound}
          >
            <span className="hud__bars" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
            <span>{sound ? site.hud.soundOn : site.hud.soundOff}</span>
          </button>
          <span className="hud__tag">{site.hud.tagline}</span>
        </div>
      </div>

      <div className={`toast${toast ? ' is-visible' : ''}`} role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  )
}
