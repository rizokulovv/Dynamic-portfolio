import { useId, useRef, useState } from 'react'
import { site } from '../data/site'
import { velocityBlur } from '../lib/motionblur'
import { gsap, prefersReducedMotion, useGsap } from '../lib/scroll'
import { play } from '../lib/sound'

const CONNECTOR = 'M0 60 C 40 60, 44 18, 100 18 S 160 102, 200 60'

/**
 * Horizontal process track. Scroll moves the track so the active step sits in
 * the centre; a violet pill tracks the active step, connectors draw between
 * cards and the track smears with scroll velocity.
 */
export function Process() {
  const { eyebrow, title, steps } = site.process
  const root = useRef<HTMLElement>(null)
  const uid = useId().replace(/:/g, '')
  const [reduce] = useState(prefersReducedMotion)

  useGsap(
    () => {
      const section = root.current
      if (!section || reduce) return
      const q = gsap.utils.selector(section)
      const track = q('.process__track')[0] as HTMLElement
      const cards = q('.step') as HTMLElement[]
      const pills = q('.pill') as HTMLElement[]
      const pillBg = q('.process__pill-bg')[0] as HTMLElement
      const N = cards.length
      const blur = velocityBlur(track, 'x', { max: 14, factor: 1 / 170 })
      let active = -1

      const xFor = (i: number) => section.clientWidth / 2 - (cards[i].offsetLeft + cards[i].offsetWidth / 2)
      const placePill = (i: number, animate: boolean) => {
        const p = pills[i]
        const vars = { x: p.offsetLeft, width: p.offsetWidth }
        if (animate) gsap.to(pillBg, { ...vars, duration: 0.55, ease: 'expo.out' })
        else gsap.set(pillBg, vars)
      }
      const setActive = (i: number) => {
        if (i === active) return
        const first = active === -1
        active = i
        cards.forEach((c, j) => c.classList.toggle('is-active', j === i))
        pills.forEach((p, j) => p.classList.toggle('is-active', j === i))
        placePill(i, !first)
        if (!first) play('tick', { volume: 0.5 })
      }

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${Math.round(window.innerHeight * (N - 1) * 0.85)}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (!self.isActive) return
            blur.update(self.getVelocity())
            setActive(Math.round(self.progress * (N - 1)))
          },
          onRefresh: () => {
            if (active >= 0) placePill(active, false)
          },
        },
      })
      tl.fromTo(track, { x: () => xFor(0) }, { x: () => xFor(N - 1), duration: N - 1 }, 0)
      q('.step__draw').forEach((path, i) => {
        tl.fromTo(path, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.55 }, i + 0.2)
      })
      tl.fromTo(q('.process__progress-fill'), { scaleX: 0 }, { scaleX: 1, duration: N - 1 }, 0)
      setActive(0)

      return () => blur.destroy()
    },
    root,
    [],
  )

  return (
    <section ref={root} id="process" className={`process${reduce ? ' is-static' : ''}`} data-hud="light" aria-labelledby="process-title">
      <header className="process__head">
        <p className="eyebrow">{eyebrow}</p>
        <h2 id="process-title" className="process__title">
          {title}
        </h2>
        <div className="process__pills" aria-hidden="true">
          <span className="process__pill-bg" />
          {steps.map((s) => (
            <span key={s.number} className="pill mono">
              <span className="pill__long">STEP </span>
              {s.number}
              <span className="pill__long"> —</span> {s.label}
            </span>
          ))}
        </div>
      </header>

      <div className="process__viewport">
        <ol className="process__track">
          {steps.map((s, i) => (
            <li key={s.number} className="step">
              <span className="step__label mono">
                STEP {s.number} — {s.label}
              </span>
              <h3 className="step__title">{s.title}</h3>
              <p className="step__body">{s.body}</p>
              <ul className="step__list">
                {s.deliverables.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
              <span className="step__index" aria-hidden="true">
                {s.number}
              </span>
              {i < steps.length - 1 && (
                <svg className="step__connector" viewBox="0 0 200 120" preserveAspectRatio="none" aria-hidden="true">
                  <defs>
                    <mask id={`${uid}-m${i}`} maskUnits="userSpaceOnUse" x="-10" y="-10" width="220" height="140">
                      <path className="step__draw" d={CONNECTOR} pathLength={1} />
                    </mask>
                  </defs>
                  <path className="step__dash" d={CONNECTOR} mask={`url(#${uid}-m${i})`} />
                  <circle className="step__node" cx="0" cy="60" r="5" />
                  <circle className="step__node" cx="200" cy="60" r="5" />
                </svg>
              )}
            </li>
          ))}
        </ol>
      </div>

      <div className="process__progress" aria-hidden="true">
        <span className="process__progress-fill" />
      </div>
    </section>
  )
}
