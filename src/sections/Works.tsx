import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flip } from 'gsap/Flip'
import { site } from '../data/site'
import { filters, kindLabels, works, type Work, type WorkFilter } from '../data/works'
import { gsap, prefersReducedMotion, ScrollTrigger, useGsap } from '../lib/scroll'
import { play } from '../lib/sound'

gsap.registerPlugin(Flip)

type FilterId = 'all' | WorkFilter

function WorkCard({ work }: { work: Work }) {
  const { cover } = work
  return (
    <Link to={`/works/${work.slug}`} className="work-card" data-cursor={site.works.cursor}>
      <div className="work-card__media">
        <img
          src={cover.src}
          srcSet={cover.srcSmall ? `${cover.srcSmall} 800w, ${cover.src} ${cover.width}w` : undefined}
          sizes="(max-width: 760px) 92vw, 46vw"
          width={cover.width}
          height={cover.height}
          alt={cover.alt}
          loading="lazy"
          decoding="async"
        />
        <span className="work-card__ring" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
      </div>
      <div className="work-card__head">
        <span className="work-card__num mono">{work.number}</span>
        <h3 className="work-card__title">{work.title}</h3>
        <span className={`badge badge--${work.kind}`}>{kindLabels[work.kind]}</span>
      </div>
      <p className="work-card__desc">{work.description}</p>
      <div className="work-card__foot mono">
        <span>{work.category}</span>
        <span>{work.year}</span>
      </div>
    </Link>
  )
}

/** Data-driven project grid with Flip-animated filtering. */
export function Works() {
  const w = site.works
  const root = useRef<HTMLElement>(null)
  const [filter, setFilter] = useState<FilterId>('all')
  const flipState = useRef<Flip.FlipState | null>(null)

  const counts = useMemo(() => {
    const out = {} as Record<FilterId, number>
    filters.forEach((f) => {
      out[f.id] = f.id === 'all' ? works.length : works.filter((x) => x.filters.includes(f.id as WorkFilter)).length
    })
    return out
  }, [])

  // Visibility + the desktop column offset (every second *visible* card).
  const layout = useMemo(() => {
    const shown = works.filter((w) => filter === 'all' || w.filters.includes(filter)).map((w) => w.slug)
    return works.map((work) => {
      const index = shown.indexOf(work.slug)
      return { work, visible: index >= 0, offset: index % 2 === 1 }
    })
  }, [filter])

  const choose = (id: FilterId) => {
    if (id === filter || !root.current) return
    flipState.current = Flip.getState(root.current.querySelectorAll('.works__item'))
    play('tick', { volume: 0.6 })
    setFilter(id)
  }

  useLayoutEffect(() => {
    const state = flipState.current
    flipState.current = null
    if (!state) return
    if (prefersReducedMotion()) {
      ScrollTrigger.refresh()
      return
    }
    Flip.from(state, {
      duration: 0.7,
      ease: 'expo.inOut',
      absolute: true,
      onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.6, delay: 0.25, ease: 'power3.out' }),
      onLeave: (els) => gsap.to(els, { autoAlpha: 0, scale: 0.96, duration: 0.3 }),
      onComplete: () => ScrollTrigger.refresh(),
    })
  }, [filter])

  useGsap(
    () => {
      if (prefersReducedMotion()) return
      const items = gsap.utils.toArray<HTMLElement>('.work-card')
      items.forEach((card) => {
        const img = card.querySelector('img')
        gsap.fromTo(card, { y: 90, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: card, start: 'top 92%', once: true } })
        if (img) gsap.fromTo(img, { scale: 1.16 }, { scale: 1, duration: 1.6, ease: 'expo.out', clearProps: 'transform', scrollTrigger: { trigger: card, start: 'top 92%', once: true } })
      })
      gsap.fromTo('.works__title-line > span', { yPercent: 105 }, { yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '.works__title', start: 'top 85%', once: true } })
    },
    root,
    [],
  )

  return (
    <section ref={root} id="works" className="works" data-hud="light" aria-labelledby="works-title">
      <header className="works__head">
        <p className="eyebrow">{w.eyebrow}</p>
        <h2 id="works-title" className="works__title">
          {w.title.split(' ').map((word) => (
            <span key={word} className="works__title-line">
              <span>{word}</span>
            </span>
          ))}
        </h2>
        <p className="works__intro">{w.intro}</p>
        <div className="filters" role="group" aria-label="Filter projects">
          {filters.map((f) => (
            <button key={f.id} type="button" className="filter" aria-pressed={filter === f.id} onClick={() => choose(f.id)}>
              {f.label}
              <sup>{counts[f.id]}</sup>
            </button>
          ))}
        </div>
      </header>

      <ul className="works__grid">
        {layout.map(({ work, visible, offset }) => (
          <li key={work.slug} className={`works__item${offset ? ' is-offset' : ''}`} hidden={!visible}>
            <WorkCard work={work} />
          </li>
        ))}
      </ul>
      {counts[filter] === 0 && <p className="works__empty">{w.empty}</p>}
    </section>
  )
}
