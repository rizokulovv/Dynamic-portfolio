import { useRef, useState } from 'react'
import { site } from '../data/site'
import { gsap, prefersReducedMotion, ScrollTrigger, useGsap } from '../lib/scroll'

const BASE_SPEED = 70 // px per second at rest
const MAX_BOOST = 14

/**
 * Two counter-running marquees (solid + outlined). Scroll velocity boosts
 * their speed, flips their direction and skews them; hovering slows them to a
 * crawl. Under reduced motion the list renders as static wrapped text.
 */
export function Stack() {
  const { eyebrow, items } = site.stack
  const root = useRef<HTMLElement>(null)
  const [reduce] = useState(prefersReducedMotion)
  const reversed = [...items].reverse()

  useGsap(
    () => {
      const section = root.current
      if (!section || reduce) return
      const rows = Array.from(section.querySelectorAll<HTMLElement>('.marquee__row'))
      const tracks = rows.map((r) => r.querySelector<HTMLElement>('.marquee__track')!)
      const setX = tracks.map((t) => gsap.quickSetter(t, 'x', 'px'))
      const skewTo = rows.map((r) => gsap.quickTo(r, 'skewX', { duration: 0.6, ease: 'power3' }))
      const offset: number[] = tracks.map((_, i) => (i === 0 ? 0 : -0.5))
      const widths = tracks.map((t) => t.scrollWidth / 2)
      const speed = { hover: 1 }
      let boost = 0
      let dir = 1
      let visible = false
      let skewed = false

      const measure = () => tracks.forEach((t, i) => (widths[i] = t.scrollWidth / 2))
      const st = ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => (visible = self.isActive),
        onRefresh: measure,
        onUpdate: (self) => {
          const v = self.getVelocity()
          boost = Math.min(MAX_BOOST, Math.max(boost, Math.abs(v) / 220))
          if (Math.abs(v) > 40) dir = v < 0 ? -1 : 1
          const skew = gsap.utils.clamp(-14, 14, v / 260)
          skewTo.forEach((fn, i) => fn(i === 0 ? -skew : skew))
          skewed = true
        },
      })
      visible = st.isActive

      const tick = (_time: number, deltaMs: number) => {
        if (!visible) return
        const dt = Math.min(deltaMs, 64) / 1000
        boost *= Math.pow(0.04, dt) // decays to ~4% per second
        if (skewed && boost < 0.4) {
          skewTo.forEach((fn) => fn(0))
          skewed = false
        }
        const v = BASE_SPEED * (1 + boost) * speed.hover * dir
        tracks.forEach((_, i) => {
          const w = widths[i] || 1
          // Row 0 runs left, row 1 runs right; scroll direction flips both.
          offset[i] = gsap.utils.wrap(-1, 0, offset[i] - ((i === 0 ? 1 : -1) * v * dt) / w)
          setX[i](offset[i] * w)
        })
      }
      gsap.ticker.add(tick)

      const slow = () => gsap.to(speed, { hover: 0.18, duration: 0.6, ease: 'power2.out', overwrite: true })
      const resume = () => gsap.to(speed, { hover: 1, duration: 0.9, ease: 'power2.inOut', overwrite: true })
      const marquee = section.querySelector<HTMLElement>('.marquee')!
      marquee.addEventListener('pointerenter', slow)
      marquee.addEventListener('pointerleave', resume)
      marquee.addEventListener('focusin', slow)
      marquee.addEventListener('focusout', resume)
      section.classList.add('is-js')

      return () => {
        gsap.ticker.remove(tick)
        marquee.removeEventListener('pointerenter', slow)
        marquee.removeEventListener('pointerleave', resume)
        marquee.removeEventListener('focusin', slow)
        marquee.removeEventListener('focusout', resume)
        section.classList.remove('is-js')
      }
    },
    root,
    [],
  )

  const row = (list: string[], outline: boolean) => (
    <div className={`marquee__row${outline ? ' marquee__row--outline' : ''}`}>
      <div className="marquee__track">
        {[0, 1].map((copy) => (
          <ul key={copy} className="marquee__group" aria-hidden="true">
            {list.map((item) => (
              <li key={item}>
                <span>{item}</span>
                <i className="marquee__dot" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  )

  return (
    <section ref={root} id="stack" className="stack" data-hud="dark" aria-labelledby="stack-title">
      <h2 id="stack-title" className="eyebrow eyebrow--light stack__eyebrow">
        {eyebrow}
      </h2>
      <div className="marquee" tabIndex={0} role="group" aria-label={items.join(', ')}>
        {row(items, false)}
        {!reduce && row(reversed, true)}
      </div>
    </section>
  )
}
