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

/**
 * Route transition: a night panel wipes up, the next route mounts underneath
 * (scroll reset + ScrollTrigger refresh), then the panel wipes away.
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
    labelRef.current.textContent = labelFor(location.pathname)
    lockScroll()
    play('whoosh', { volume: 0.55 })
    gsap.killTweensOf([panel, barRef.current])
    gsap
      .timeline()
      .set(overlay, { visibility: 'visible' })
      .fromTo(panel, { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: 'expo.inOut' })
      .fromTo(barRef.current, { scaleX: 0 }, { scaleX: 1, duration: 0.55, ease: 'power2.inOut' }, 0.1)
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
    gsap.to(panelRef.current, {
      yPercent: -100,
      duration: 0.75,
      ease: 'expo.inOut',
      delay: 0.08,
      onComplete: () => {
        gsap.set(overlayRef.current, { visibility: 'hidden' })
      },
    })
  }, [shown])

  return (
    <>
      {children(shown)}
      <div ref={overlayRef} className="transition" aria-hidden="true">
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
