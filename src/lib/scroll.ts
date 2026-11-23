import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useCallback, useLayoutEffect, type DependencyList, type RefObject } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { SectionId } from '../data/site'

gsap.registerPlugin(ScrollTrigger)

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
export const prefersReducedMotion = (): boolean => motionQuery.matches

let lenis: Lenis | null = null
let refreshTimer = 0

/** Debounced ScrollTrigger.refresh() — call after layout-affecting changes. */
export function scheduleRefresh(delay = 150): void {
  window.clearTimeout(refreshTimer)
  refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), delay)
}

/**
 * Initialise Lenis + GSAP ticker sync. Called once from main.tsx BEFORE React
 * renders, so every ScrollTrigger created by components is driven by Lenis.
 */
export function initScroll(): Lenis {
  if (lenis) return lenis
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

  const reduce = prefersReducedMotion()
  lenis = new Lenis({
    lerp: reduce ? 1 : 0.1,
    smoothWheel: !reduce,
    wheelMultiplier: 0.95,
    touchMultiplier: 1.2,
  })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis?.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
  ScrollTrigger.config({ ignoreMobileResize: true })

  // Fonts and images change layout after first paint: re-measure triggers.
  void document.fonts?.ready.then(() => scheduleRefresh(50))
  document.addEventListener(
    'load',
    (e) => {
      if (e.target instanceof HTMLImageElement) scheduleRefresh()
    },
    true,
  )
  window.addEventListener('load', () => scheduleRefresh(50))
  // Dev-only handles for debugging scroll scenes from the console.
  if (import.meta.env.DEV) Object.assign(window, { __lenis: lenis, __ScrollTrigger: ScrollTrigger })
  return lenis
}

export const getLenis = (): Lenis | null => lenis

/** Pinned sections live inside a `.pin-spacer`; scroll to the spacer instead. */
function resolveTarget(el: HTMLElement): HTMLElement {
  const parent = el.parentElement
  return parent?.classList.contains('pin-spacer') ? parent : el
}

export function scrollToY(y: number, opts: { immediate?: boolean; duration?: number } = {}): void {
  const immediate = opts.immediate ?? prefersReducedMotion()
  if (!lenis) {
    window.scrollTo(0, y)
    return
  }
  // After a route swap the document height changes before Lenis' ResizeObserver
  // fires; re-measure so the target isn't clamped to the previous page's limit.
  lenis.resize()
  if (immediate) window.scrollTo(0, y)
  lenis.scrollTo(y, { immediate, force: true, duration: opts.duration ?? 1.4 })
}

export function scrollToSection(id: SectionId | string, opts: { immediate?: boolean; offset?: number } = {}): void {
  if (id === 'top') {
    scrollToY(0, { immediate: opts.immediate, duration: 1.6 })
    return
  }
  const el = document.getElementById(id)
  if (!el) return
  // Measure from the live layout (window.scrollY), not Lenis' cached position.
  const y = resolveTarget(el).getBoundingClientRect().top + window.scrollY + (opts.offset ?? 0)
  scrollToY(y, { immediate: opts.immediate, duration: 1.6 })
}

let locks = 0
export function lockScroll(): void {
  locks += 1
  lenis?.stop()
  document.documentElement.classList.add('is-locked')
}
export function unlockScroll(): void {
  locks = Math.max(0, locks - 1)
  if (locks > 0) return
  lenis?.start()
  document.documentElement.classList.remove('is-locked')
}

/**
 * Run GSAP setup inside gsap.context() scoped to `scope`, reverting every
 * tween + ScrollTrigger on unmount / dependency change.
 */
export function useGsap(setup: () => void | (() => void), scope: RefObject<HTMLElement | null>, deps: DependencyList = []): void {
  useLayoutEffect(() => {
    if (!scope.current) return
    const ctx = gsap.context(setup, scope.current)
    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/** Navigate to a homepage section from anywhere (scrolls in place on "/"). */
export function useGoTo(): (id: SectionId) => void {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  return useCallback(
    (id: SectionId) => {
      if (pathname === '/') scrollToSection(id)
      else navigate(id === 'top' ? '/' : `/#${id}`)
    },
    [navigate, pathname],
  )
}

export { gsap, ScrollTrigger }
