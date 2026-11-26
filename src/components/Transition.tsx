import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, type Location } from 'react-router-dom'
import { site } from '../data/site'
import { getWork } from '../data/works'
import { gsap, lockScroll, prefersReducedMotion, ScrollTrigger, scrollToSection, scrollToY, unlockScroll } from '../lib/scroll'
import { play } from '../lib/sound'

function labelFor(pathname: string): string {
  if (pathname === '/') return site.brand
  const match = /^\/works\/([^/]+)/.exec(pathname)
  if (match) return getWork(match[1])?.title ?? site.notFound.code
  return site.notFound.code
}

const COLS = 5

/**
 * Route transition: five night shutters rise in a stagger, the next route
 * mounts underneath (scroll reset + ScrollTrigger refresh), then the shutters
 * continue upward and away.
 */
export function Transition({ children }: { children: (location: Location) => ReactNode }) {
  const location = useLocation()
  const [shown, setShown] = useState(location)
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const barRef = useRef<HTMLSpanElement>(null)
  const reveal = useRef<'none' | 'animated' | 'instant'>('none')

  useEffect(() => {
    const same = location.key === shown.key && location.pathname === shown.pathname && location.hash === shown.hash
    if (same) return
    // Same page (e.g. "/#works" while on "/"): just scroll.
    if (location.pathname === shown.pathname) {
      setShown(location)
      if (location.hash) scrollToSection(location.hash.slice(1))
      return
    }
    // "/works" is only a redirect — swap without a wipe.
    if (shown.pathname === '/works' || prefersReducedMotion()) {
      reveal.current = 'instant'
      setShown(location)
      return
    }
    const overlay = overlayRef.current
    const panel = panelRef.current
    if (!overlay || !panel || !labelRef.current) return
    const cols = overlay.querySelectorAll('.transition__col')
    labelRef.current.textContent = labelFor(location.pathname)
    lockScroll()
    play('whoosh', { volume: 0.55 })
    gsap.killTweensOf([panel, barRef.current, labelRef.current, ...cols])
    gsap
      .timeline()
      .set(overlay, { visibility: 'visible' })
      .fromTo(cols, { y: 0, yPercent: 100 }, { yPercent: 0, duration: 0.62, ease: 'expo.inOut', stagger: 0.045 })
      .fromTo(panel, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 0.3)
      .fromTo(labelRef.current, { yPercent: 70, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.55, ease: 'expo.out' }, 0.34)
      .fromTo(barRef.current, { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: 'power2.inOut' }, 0.32)
      .add(() => {
        reveal.current = 'animated'
        setShown(location)
      })
    // `shown` intentionally omitted: this reacts to router navigation only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location])

  // Runs after the new route's own layout effects (its ScrollTriggers exist).
  useLayoutEffect(() => {
    const mode = reveal.current
    if (mode === 'none') return
    reveal.current = 'none'
    scrollToY(0, { immediate: true })
    ScrollTrigger.refresh()
    if (mode === 'instant') return
    unlockScroll()
    const cols = overlayRef.current?.querySelectorAll('.transition__col') ?? []
    gsap
      .timeline({ delay: 0.08, onComplete: () => void gsap.set(overlayRef.current, { visibility: 'hidden' }) })
      .to(panelRef.current, { autoAlpha: 0, y: -40, duration: 0.35, ease: 'power2.in' })
      .to(cols, { yPercent: -100, duration: 0.8, ease: 'expo.inOut', stagger: 0.05 }, 0.12)
      .set(panelRef.current, { y: 0 })
  }, [shown])

  return (
    <>
      {children(shown)}
      <div ref={overlayRef} className="transition" aria-hidden="true">
        <div className="transition__cols">
          {Array.from({ length: COLS }, (_, i) => (
            <i key={i} className="transition__col" />
          ))}
        </div>
        <div ref={panelRef} className="transition__panel">
          <span className="transition__meta">Loading frame</span>
          <span ref={labelRef} className="transition__label" />
          <span className="transition__bar">
            <span ref={barRef} />
          </span>
        </div>
      </div>
    </>
  )
}
