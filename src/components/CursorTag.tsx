import { useEffect, useRef } from 'react'
import { gsap } from '../lib/scroll'

/**
 * Figma-style multiplayer cursor. Any element with `data-cursor="Label"`
 * swaps the native pointer for a violet arrow + name tag. Fine pointers only.
 */
export function CursorTag() {
  const ref = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    const labelEl = labelRef.current
    if (!el || !labelEl) return
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    if (!fine.matches) return

    const xTo = gsap.quickTo(el, 'x', { duration: 0.28, ease: 'power3' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.28, ease: 'power3' })
    let current: string | null = null
    let px = -100
    let py = -100

    const evaluate = (target: Element | null) => {
      const host = target?.closest<HTMLElement>('[data-cursor]') ?? null
      const label = host?.dataset.cursor ?? null
      if (label === current) return
      current = label
      if (label) {
        labelEl.textContent = label
        el.classList.add('is-visible')
      } else {
        el.classList.remove('is-visible')
      }
    }
    const move = (e: PointerEvent) => {
      px = e.clientX
      py = e.clientY
      if (!current) gsap.set(el, { x: px, y: py })
      xTo(px)
      yTo(py)
      evaluate(e.target as Element | null)
    }
    // Content scrolls under a still pointer — re-check what's beneath it.
    const recheck = () => evaluate(document.elementFromPoint(px, py))
    const hide = () => {
      current = null
      el.classList.remove('is-visible')
    }

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('scroll', recheck, { passive: true })
    document.documentElement.addEventListener('pointerleave', hide)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('scroll', recheck)
      document.documentElement.removeEventListener('pointerleave', hide)
    }
  }, [])

  return (
    <div ref={ref} className="cursor-tag" aria-hidden="true">
      <svg className="cursor-tag__arrow" viewBox="0 0 20 22" width="20" height="22">
        <path d="M2 2 L18 9.5 L10.6 11.4 L7.4 19 Z" />
      </svg>
      <span ref={labelRef} className="cursor-tag__label" />
    </div>
  )
}
