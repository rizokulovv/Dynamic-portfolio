import { gsap } from 'gsap'
import { prefersReducedMotion } from './scroll'

/**
 * Shared motion effects: text scramble, particle bursts and pointer tilt.
 * Every effect is a no-op (or resolves instantly) under reduced motion.
 */

const fineQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
/** True for mouse / trackpad users — hover-driven effects are skipped on touch. */
export const isFinePointer = (): boolean => fineQuery.matches

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>/\\[]{}_'

/**
 * "Decode" text: characters resolve left to right out of churning random
 * glyphs (same length throughout, so monospace text never reflows). Writes to
 * the element's single text node so React keeps ownership of the DOM; elements
 * with child elements are left untouched. Returns a tween that can live inside
 * a timeline; at progress 1 the original text is always restored exactly.
 */
export function scramble(el: HTMLElement, opts: { duration?: number; delay?: number; text?: string } = {}): gsap.core.Tween {
  const node = el.firstChild instanceof Text && el.childNodes.length === 1 ? el.firstChild : null
  if (!node) return gsap.to({}, { duration: 0 })
  const target = opts.text ?? el.dataset.scrambleText ?? node.nodeValue ?? ''
  el.dataset.scrambleText = target
  const write = (value: string) => {
    node.nodeValue = value
  }
  const state = { p: 0 }
  const n = target.length
  return gsap.fromTo(
    state,
    { p: 0 },
    {
      p: 1,
      duration: opts.duration ?? 0.9,
      delay: opts.delay ?? 0,
      ease: 'none',
      immediateRender: false,
      onUpdate: () => {
        if (state.p >= 1) {
          write(target)
          return
        }
        const head = state.p * n
        let out = ''
        for (let i = 0; i < n; i++) {
          const ch = target[i]
          out += i < head || ch === ' ' ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]
        }
        write(out)
      },
      onComplete: () => write(target),
    },
  )
}

// ── Particle bursts ─────────────────────────────────────────────────────────
let layer: HTMLDivElement | null = null
function fxLayer(): HTMLDivElement {
  if (layer?.isConnected) return layer
  layer = document.createElement('div')
  layer.className = 'fx-layer'
  layer.setAttribute('aria-hidden', 'true')
  document.body.appendChild(layer)
  return layer
}

export interface BurstOptions {
  count?: number
  spread?: number
  size?: number
  colors?: string[]
  /** Extra downward drift after the explosion (px). */
  gravity?: number
}

const BURST_COLORS = ['#6b4eff', '#8a73ff', '#c6ff3d', '#ffffff', '#5a3df0']

/** Confetti-style burst at a viewport point (client coordinates). */
export function burst(x: number, y: number, opts: BurstOptions = {}): void {
  if (prefersReducedMotion()) return
  const { count = 18, spread = 150, size = 9, colors = BURST_COLORS, gravity = 70 } = opts
  const host = fxLayer()
  const r = gsap.utils.random
  for (let i = 0; i < count; i++) {
    const p = document.createElement('i')
    const s = size * r(0.45, 1.25)
    const shape = i % 4
    p.className = `fx-particle fx-particle--${shape === 0 ? 'bar' : shape === 1 ? 'square' : 'dot'}`
    p.style.cssText = `left:${x}px;top:${y}px;width:${s}px;height:${shape === 0 ? s * 0.35 : s}px;background:${colors[i % colors.length]}`
    host.appendChild(p)
    const angle = (i / count) * Math.PI * 2 + r(-0.35, 0.35)
    const dist = spread * r(0.45, 1.15)
    gsap
      .timeline({ onComplete: () => p.remove() })
      .set(p, { xPercent: -50, yPercent: -50, scale: r(0.6, 1.2) })
      .to(p, { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, rotation: r(-260, 260), duration: r(0.7, 1.05), ease: 'expo.out' })
      .to(p, { y: `+=${r(gravity * 0.5, gravity * 1.3)}`, autoAlpha: 0, scale: 0.2, duration: r(0.5, 0.8), ease: 'power2.in' }, '-=0.45')
  }
}

/** Burst from the centre of an element. */
export function burstFrom(el: Element, opts?: BurstOptions): void {
  const b = el.getBoundingClientRect()
  burst(b.left + b.width / 2, b.top + b.height / 2, opts)
}

/**
 * Pointer-driven 3D tilt with a moving glare highlight (`--gx`/`--gy`).
 * Returns a cleanup function. Fine pointers only.
 */
export function tilt(el: HTMLElement, opts: { max?: number; glare?: HTMLElement | null; perspective?: number } = {}): () => void {
  if (!isFinePointer() || prefersReducedMotion()) return () => {}
  const { max = 8, glare = null, perspective = 1000 } = opts
  gsap.set(el, { transformPerspective: perspective })
  const rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3' })
  const ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3' })
  const move = (e: PointerEvent) => {
    const b = el.getBoundingClientRect()
    const nx = (e.clientX - b.left) / b.width
    const ny = (e.clientY - b.top) / b.height
    ry((nx - 0.5) * max * 2)
    rx(-(ny - 0.5) * max * 2)
    if (glare) {
      glare.style.setProperty('--gx', `${(nx * 100).toFixed(1)}%`)
      glare.style.setProperty('--gy', `${(ny * 100).toFixed(1)}%`)
    }
  }
  const leave = () => {
    rx(0)
    ry(0)
  }
  el.addEventListener('pointermove', move)
  el.addEventListener('pointerleave', leave)
  return () => {
    el.removeEventListener('pointermove', move)
    el.removeEventListener('pointerleave', leave)
  }
}
