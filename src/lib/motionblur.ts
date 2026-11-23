import { gsap } from 'gsap'

/**
 * Directional motion blur for HTML/SVG elements.
 *
 * CSS `filter: blur()` is isotropic, so each instance owns an SVG
 * <feGaussianBlur> whose stdDeviation is set per-axis ("x 0" or "0 y").
 * The filter is only attached while the amount is visible, so idle elements
 * are never filtered.
 */
const SVG_NS = 'http://www.w3.org/2000/svg'
let defs: SVGDefsElement | null = null
let uid = 0

function ensureDefs(): SVGDefsElement {
  if (defs?.isConnected) return defs
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none'
  defs = document.createElementNS(SVG_NS, 'defs')
  svg.appendChild(defs)
  document.body.appendChild(svg)
  return defs
}

export type BlurAxis = 'x' | 'y'

export interface MotionBlur {
  /** Current blur radius in px. Tween this with GSAP. */
  amount: number
  readonly id: string
  destroy(): void
}

export function motionBlur(el: HTMLElement | SVGElement, axis: BlurAxis = 'x'): MotionBlur {
  const id = `mb-${++uid}`
  const filter = document.createElementNS(SVG_NS, 'filter')
  filter.setAttribute('id', id)
  // Generous filter region so long horizontal smears are not clipped.
  filter.setAttribute('x', axis === 'x' ? '-35%' : '-5%')
  filter.setAttribute('width', axis === 'x' ? '170%' : '110%')
  filter.setAttribute('y', axis === 'y' ? '-35%' : '-15%')
  filter.setAttribute('height', axis === 'y' ? '170%' : '130%')
  filter.setAttribute('color-interpolation-filters', 'sRGB')
  const blur = document.createElementNS(SVG_NS, 'feGaussianBlur')
  blur.setAttribute('in', 'SourceGraphic')
  blur.setAttribute('stdDeviation', '0 0')
  filter.appendChild(blur)
  ensureDefs().appendChild(filter)

  let value = 0
  const apply = (v: number) => {
    value = v
    const a = Math.max(0, v)
    if (a < 0.2) {
      el.style.removeProperty('filter')
      return
    }
    blur.setAttribute('stdDeviation', axis === 'x' ? `${a.toFixed(2)} 0` : `0 ${a.toFixed(2)}`)
    el.style.filter = `url(#${id})`
  }

  return {
    id,
    get amount() {
      return value
    },
    set amount(v: number) {
      apply(v)
    },
    destroy() {
      el.style.removeProperty('filter')
      filter.remove()
    },
  }
}

/**
 * Velocity-driven blur: feed it a velocity (px/s, e.g. ScrollTrigger's
 * self.getVelocity()) and it smears proportionally, then settles to zero.
 */
export function velocityBlur(el: HTMLElement | SVGElement, axis: BlurAxis = 'x', opts: { max?: number; factor?: number } = {}) {
  const { max = 22, factor = 1 / 140 } = opts
  const mb = motionBlur(el, axis)
  let settle: gsap.core.Tween | null = null
  return {
    update(velocity: number) {
      const target = Math.min(max, Math.abs(velocity) * factor)
      settle?.kill()
      mb.amount = Math.max(target, mb.amount * 0.6)
      settle = gsap.to(mb, { amount: 0, duration: 0.45, ease: 'power2.out', delay: 0.04 })
    },
    destroy() {
      settle?.kill()
      mb.destroy()
    },
  }
}
