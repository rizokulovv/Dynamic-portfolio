import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { burst, burstFrom, isFinePointer, scramble } from '../lib/fx'
import { gsap, prefersReducedMotion } from '../lib/scroll'

const INTERACTIVE = 'a, button, [role="switch"], input, textarea, select, label, summary'

/**
 * Global, DOM-delegated motion layer:
 *  • scroll progress line along the top edge
 *  • trailing ring cursor (blend-mode difference) — hides where the Figma cursor tag takes over
 *  • magnetic pull on every `[data-magnetic]` element
 *  • decode/scramble on `.eyebrow` labels as they enter the viewport, and on `[data-scramble-hover]` hover
 *  • confetti burst when a primary button is pressed
 */
export function Effects() {
  const ringRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()

  // ── scroll progress ─────────────────────────────────────────────────────
  useEffect(() => {
    const bar = barRef.current
    if (!bar) return
    const set = gsap.quickSetter(bar, 'scaleX')
    let raf = 0
    const update = () => {
      raf = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      set(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0)
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    schedule()
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      cancelAnimationFrame(raf)
    }
  }, [pathname])

  // ── ring cursor + magnetic elements ─────────────────────────────────────
  useEffect(() => {
    const ring = ringRef.current
    if (!ring || !isFinePointer() || prefersReducedMotion()) return
    const xTo = gsap.quickTo(ring, 'x', { duration: 0.42, ease: 'power3' })
    const yTo = gsap.quickTo(ring, 'y', { duration: 0.42, ease: 'power3' })
    let magnet: HTMLElement | null = null
    let shown = false

    const release = (el: HTMLElement) => gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)', overwrite: 'auto' })
    const move = (e: PointerEvent) => {
      if (!shown) {
        gsap.set(ring, { x: e.clientX, y: e.clientY })
        shown = true
      }
      ring.classList.add('is-visible')
      xTo(e.clientX)
      yTo(e.clientY)
      const target = e.target instanceof Element ? e.target : null
      const tagged = !!target?.closest('[data-cursor]')
      ring.classList.toggle('is-hidden', tagged)
      ring.classList.toggle('is-hover', !tagged && !!target?.closest(INTERACTIVE))

      const m = target?.closest<HTMLElement>('[data-magnetic]') ?? null
      if (m !== magnet) {
        if (magnet) release(magnet)
        magnet = m
      }
      if (m) {
        const b = m.getBoundingClientRect()
        const cx = b.left + b.width / 2 - Number(gsap.getProperty(m, 'x'))
        const cy = b.top + b.height / 2 - Number(gsap.getProperty(m, 'y'))
        const pull = Number(m.dataset.magnetic) || 0.32
        gsap.to(m, { x: (e.clientX - cx) * pull, y: (e.clientY - cy) * pull, duration: 0.5, ease: 'power3.out', overwrite: 'auto' })
      }
    }
    const leave = () => {
      ring.classList.remove('is-visible')
      if (magnet) release(magnet)
      magnet = null
    }
    const down = () => ring.classList.add('is-down')
    const up = () => ring.classList.remove('is-down')

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', down, { passive: true })
    window.addEventListener('pointerup', up, { passive: true })
    document.documentElement.addEventListener('pointerleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      document.documentElement.removeEventListener('pointerleave', leave)
    }
  }, [])

  // ── confetti on primary buttons ─────────────────────────────────────────
  useEffect(() => {
    const click = (e: MouseEvent) => {
      const btn = e.target instanceof Element ? e.target.closest('.btn--primary') : null
      if (!btn) return
      const opts = { count: 14, spread: 110, size: 8, gravity: 50 }
      // Keyboard activation reports (0, 0): burst from the button instead.
      if (e.detail === 0) burstFrom(btn, opts)
      else burst(e.clientX, e.clientY, opts)
    }
    window.addEventListener('click', click)
    return () => window.removeEventListener('click', click)
  }, [])

  // ── scramble labels ─────────────────────────────────────────────────────
  useEffect(() => {
    if (prefersReducedMotion()) return
    const running = new WeakSet<HTMLElement>()
    const run = (el: HTMLElement, duration: number) => {
      if (running.has(el)) return
      running.add(el)
      scramble(el, { duration }).eventCallback('onComplete', () => running.delete(el))
    }
    let io: IntersectionObserver | null = null
    // Wait for the route transition to mount the new page.
    const timer = window.setTimeout(() => {
      io = new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return
            io?.unobserve(entry.target)
            run(entry.target as HTMLElement, 0.85)
          }),
        { threshold: 0.9 },
      )
      document.querySelectorAll<HTMLElement>('.eyebrow').forEach((el) => io?.observe(el))
    }, 450)
    const hover = (e: PointerEvent) => {
      const el = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-scramble-hover]') : null
      if (el && !el.contains(e.relatedTarget as Node | null)) run(el, 0.45)
    }
    document.addEventListener('pointerover', hover)
    return () => {
      window.clearTimeout(timer)
      io?.disconnect()
      document.removeEventListener('pointerover', hover)
    }
  }, [pathname])

  return (
    <>
      <div ref={barRef} className="scroll-progress" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  )
}
