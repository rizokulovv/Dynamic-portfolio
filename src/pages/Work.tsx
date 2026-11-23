import { useEffect, useRef, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { site } from '../data/site'
import { getWork, kindLabels, nextWork, type Work as WorkData, type WorkImage } from '../data/works'
import { motionBlur } from '../lib/motionblur'
import { gsap, prefersReducedMotion, useGsap } from '../lib/scroll'
import { NotFound } from './NotFound'

function Picture({ image, eager = false, sizes = '100vw' }: { image: WorkImage; eager?: boolean; sizes?: string }) {
  return (
    <img
      src={image.src}
      srcSet={image.srcSmall ? `${image.srcSmall} 800w, ${image.src} ${image.width}w` : undefined}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={image.alt}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : 'auto'}
      decoding="async"
    />
  )
}

function SectionBlock({ label, index, children }: { label: string; index: number; children: ReactNode }) {
  return (
    <section className="cs__block cs-reveal" aria-label={label}>
      <h2 className="cs__label mono">
        <span>{String(index).padStart(2, '0')}</span> {label}
      </h2>
      <div className="cs__body">{children}</div>
    </section>
  )
}

function CaseStudy({ work }: { work: WorkData }) {
  const p = site.workPage
  const root = useRef<HTMLElement>(null)
  const next = nextWork(work.slug)

  useEffect(() => {
    document.title = `${work.title} — ${site.brand}`
  }, [work])

  useGsap(
    () => {
      const page = root.current
      if (!page || prefersReducedMotion()) return
      const q = gsap.utils.selector(page)
      const title = q('.cs__title')[0] as HTMLElement
      const blur = motionBlur(title, 'y')

      gsap
        .timeline({ delay: 0.45 })
        .fromTo(q('.cs__char'), { yPercent: 115 }, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.02 }, 0)
        .fromTo(blur, { amount: 14 }, { amount: 0, duration: 1, ease: 'power3.out' }, 0)
        .fromTo(q('.cs__top > *, .cs__tagline'), { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.06, ease: 'power3.out' }, 0.2)

      const cover = q('.cs__cover')[0]
      gsap.fromTo(
        q('.cs__cover-frame'),
        { clipPath: 'inset(6% 5% 6% 5% round 36px)' },
        { clipPath: 'inset(0% 0% 0% 0% round 28px)', ease: 'none', scrollTrigger: { trigger: cover, start: 'top 95%', end: 'top 25%', scrub: true } },
      )
      gsap.fromTo(q('.cs__cover img'), { scale: 1.14 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: cover, start: 'top bottom', end: 'bottom top', scrub: true } })

      q('.cs-reveal').forEach((el) => {
        gsap.fromTo(el, { y: 48, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } })
      })
      q('.cs__shot img').forEach((img) => {
        gsap.fromTo(img, { yPercent: -4, scale: 1.1 }, { yPercent: 4, scale: 1.1, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } })
      })

      return () => blur.destroy()
    },
    root,
    [work.slug],
  )

  let block = 0
  const words = work.title.split(' ')

  return (
    <main ref={root} id="main" className="cs" data-hud="light">
      <header className="cs__hero">
        <div className="cs__top">
          <Link to="/#works" className="cs__back">
            <span aria-hidden="true">←</span> {p.back}
          </Link>
          <span className="cs__crumb mono">
            {work.category} · {work.year}
          </span>
          <span className={`badge badge--${work.kind}`}>{kindLabels[work.kind]}</span>
        </div>
        <h1 className="cs__title" aria-label={work.title}>
          {words.map((word, wi) => (
            <span key={`${word}-${wi}`} className="cs__word" aria-hidden="true">
              {[...word].map((ch, ci) => (
                <span key={ci} className="cs__mask">
                  <span className="cs__char">{ch}</span>
                </span>
              ))}
            </span>
          ))}
        </h1>
        <p className="cs__tagline">{work.tagline}</p>
      </header>

      <figure className="cs__cover">
        <div className="cs__cover-frame">
          <Picture image={work.cover} eager sizes="(max-width: 760px) 100vw, 92vw" />
        </div>
        {work.cover.caption && <figcaption className="mono">{work.cover.caption}</figcaption>}
      </figure>

      <dl className="cs__meta cs-reveal">
        {work.meta.map((m) => (
          <div key={m.label}>
            <dt className="mono">{m.label}</dt>
            <dd>{m.value}</dd>
          </div>
        ))}
      </dl>

      {!work.verified && work.note && (
        <p className="cs__note cs-reveal" role="note">
          <span className="mono">{p.pending}</span> {work.note}
        </p>
      )}

      <div className="cs__content">
        <SectionBlock label={p.overview} index={++block}>
          {work.overview.map((para) => (
            <p key={para.slice(0, 24)} className="cs__lead">
              {para}
            </p>
          ))}
        </SectionBlock>

        <SectionBlock label={p.challenge} index={++block}>
          {work.challenge.map((para) => (
            <p key={para.slice(0, 24)}>{para}</p>
          ))}
        </SectionBlock>

        <SectionBlock label={p.approach} index={++block}>
          <ol className="cs__approach">
            {work.approach.map((a, i) => (
              <li key={a.title}>
                <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                <h3>{a.title}</h3>
                <p>{a.body}</p>
              </li>
            ))}
          </ol>
        </SectionBlock>

        <SectionBlock label={work.stackTitle ?? p.stack} index={++block}>
          <ul className="cs__stack">
            {work.stack.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </SectionBlock>

        <SectionBlock label={p.results} index={++block}>
          <ul className="cs__results">
            {work.results.map((r) => (
              <li key={r.label}>
                <span className="cs__result-value">{r.value}</span>
                <span className="cs__result-label">{r.label}</span>
              </li>
            ))}
          </ul>
          {work.resultsNote && <p className="cs__fine mono">{work.resultsNote}</p>}
        </SectionBlock>
      </div>

      {work.gallery.length > 0 && (
        <section className="cs__gallery" aria-label={p.gallery}>
          <h2 className="cs__label mono cs-reveal">
            <span>{String(++block).padStart(2, '0')}</span> {p.gallery}
          </h2>
          <div className="cs__shots">
            {work.gallery.map((img, i) => (
              <figure key={img.src} className={`cs__shot-wrap cs-reveal${i === 0 ? ' is-wide' : ''}`}>
                <div className="cs__shot">
                  <Picture image={img} sizes={i === 0 ? '(max-width: 760px) 100vw, 92vw' : '(max-width: 760px) 100vw, 46vw'} />
                </div>
                {img.caption && <figcaption className="mono">{img.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </section>
      )}

      <Link to={`/works/${next.slug}`} className="cs__next" data-hud="dark" data-cursor="Next">
        <span className="cs__next-label mono">
          {p.next} — {next.number}
        </span>
        <span className="cs__next-title">
          {next.title} <span className="cs__next-arrow" aria-hidden="true">→</span>
        </span>
        <span className="cs__next-meta mono">
          {next.category} · {next.year}
        </span>
      </Link>
    </main>
  )
}

export function Work() {
  const { slug } = useParams()
  const work = getWork(slug)
  if (!work) return <NotFound />
  return <CaseStudy key={work.slug} work={work} />
}
