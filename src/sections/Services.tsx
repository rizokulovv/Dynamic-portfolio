import { Fragment, useRef, useState } from 'react'
import { Underline } from '../components/Underline'
import { site } from '../data/site'
import { emit } from '../lib/bus'
import { prepareStroke } from '../lib/draw'
import { motionBlur } from '../lib/motionblur'
import { gsap, prefersReducedMotion, useGsap } from '../lib/scroll'
import { play } from '../lib/sound'

const PAPER = '#fafafc'
const VIOLET = '#6b4eff'

function Title({ title, highlight, seed }: { title: string; highlight: string; seed: number }) {
  const at = title.indexOf(highlight)
  if (at < 0) return <>{title}</>
  return (
    <Fragment>
      {title.slice(0, at)}
      <span className="service__hl">
        {highlight}
        <Underline seed={seed} />
      </span>
      {title.slice(at + highlight.length)}
    </Fragment>
  )
}

/**
 * Five services on one pinned timeline. Each service holds ~90% of its slice
 * of the scroll; the remaining ~10% is a motion-blurred hand-off, with the
 * background alternating light ↔ violet.
 */
export function Services() {
  const { eyebrow, title, items } = site.services
  const root = useRef<HTMLElement>(null)
  const [reduce] = useState(prefersReducedMotion)

  useGsap(
    () => {
      const section = root.current
      if (!section || reduce) return
      const q = gsap.utils.selector(section)
      const slides = q('.service') as HTMLElement[]
      const ticks = q('.services__tick') as HTMLElement[]
      const bg = q('.services__bg')[0]
      const N = slides.length
      const blurs = slides.map((s) => motionBlur(s, 'x'))
      let active = -1

      const setActive = (i: number) => {
        if (i === active) return
        const first = active === -1
        active = i
        ticks.forEach((t, j) => t.classList.toggle('is-active', j === i))
        slides.forEach((s, j) => s.setAttribute('aria-hidden', String(j !== i)))
        const tone = i % 2 ? 'violet' : 'light'
        section.dataset.hud = tone
        section.dataset.tone = tone
        emit('hud:refresh')
        if (!first) play('tick', { volume: 0.5 })
      }

      section.querySelectorAll<SVGPathElement>('.underline path').forEach((p) => prepareStroke(p))
      gsap.set(slides.slice(1), { autoAlpha: 0, xPercent: 36 })

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${Math.round(window.innerHeight * N * 0.9)}`,
          pin: true,
          scrub: 0.7,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (!self.isActive) return
            setActive(Math.min(N - 1, Math.floor(self.progress * N)))
          },
        },
      })

      slides.forEach((slide, i) => {
        const underline = slide.querySelector('.underline path')
        const parts = slide.querySelectorAll('.service__num, .service__summary, .service__tags li')
        if (i > 0) {
          const at = i - 0.05
          tl.to(slides[i - 1], { xPercent: -36, autoAlpha: 0, duration: 0.08, ease: 'power2.in' }, at)
            .fromTo(blurs[i - 1], { amount: 0 }, { amount: 34, duration: 0.08, ease: 'power2.in' }, at)
            .to(bg, { backgroundColor: i % 2 ? VIOLET : PAPER, duration: 0.1 }, at)
            .fromTo(slide, { xPercent: 36, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 0.08, ease: 'power2.out' }, at + 0.02)
            .fromTo(blurs[i], { amount: 34 }, { amount: 0, duration: 0.08, ease: 'power2.out' }, at + 0.02)
            .from(parts, { y: 28, autoAlpha: 0, duration: 0.08, stagger: 0.012 }, at + 0.06)
        }
        if (underline) tl.fromTo(underline, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.3, ease: 'power2.inOut' }, i + 0.04)
      })
      tl.fromTo(q('.services__fill'), { scaleY: 0 }, { scaleY: 1, duration: N }, 0)
      setActive(0)

      return () => blurs.forEach((b) => b.destroy())
    },
    root,
    [],
  )

  return (
    <section ref={root} id="services" className={`services${reduce ? ' is-static' : ''}`} data-hud="light" data-tone="light" aria-labelledby="services-title">
      <div className="services__bg" aria-hidden="true" />
      <header className="services__head">
        <p className="eyebrow">{eyebrow}</p>
        <h2 id="services-title" className="visually-hidden">
          {title}
        </h2>
      </header>
      <ol className="services__list">
        {items.map((s, i) => (
          <li key={s.number} className="service" data-tone={i % 2 ? 'violet' : 'light'}>
            <span className="service__num mono">
              {s.number} / {String(items.length).padStart(2, '0')}
            </span>
            <h3 className="service__title">
              <Title title={s.title} highlight={s.highlight} seed={i + 2} />
            </h3>
            <p className="service__summary">{s.summary}</p>
            <ul className="service__tags">
              {s.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <div className="services__progress" aria-hidden="true">
        <span className="services__rail">
          <span className="services__fill" />
        </span>
        <ol>
          {items.map((s) => (
            <li key={s.number} className="services__tick mono">
              {s.number}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
