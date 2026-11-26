import { useEffect, useRef, useState } from 'react'
import { Chars } from '../components/Chars'
import { site } from '../data/site'
import { copyText, emit } from '../lib/bus'
import { gsap, prefersReducedMotion, ScrollTrigger, scrollToSection, useGsap } from '../lib/scroll'
import { play } from '../lib/sound'

const ICONS: Record<string, string> = {
  github: 'M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z',
  linkedin: 'M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11H3v-11Zm7 0h3.8v1.5h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1v5.46h-4v-4.84c0-1.16-.02-2.64-1.61-2.64-1.61 0-1.86 1.26-1.86 2.56v4.92H10v-11Z',
  telegram: 'M21.5 4.1 2.9 11.3c-1.3.5-1.3 1.2-.2 1.5l4.8 1.5 1.8 5.6c.2.6.4.8.8.8.4 0 .6-.2.9-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.7c.3-1.3-.5-1.9-1.4-1.5Zm-3.4 3.5-8.7 7.9-.3 3.6-1.6-5 10.2-6.6c.5-.3.9 0 .4.1Z',
}

/** Closing scene: giant headline, typewriter line, contact details, actions. */
export function Contact() {
  const c = site.contact
  const root = useRef<HTMLElement>(null)
  const wordRef = useRef<HTMLSpanElement>(null)
  const clockRef = useRef<HTMLSpanElement>(null)
  const [copied, setCopied] = useState(false)

  // Live local clock — written to the DOM once a second, no re-renders.
  useEffect(() => {
    const el = clockRef.current
    if (!el) return
    let format: Intl.DateTimeFormat
    try {
      format = new Intl.DateTimeFormat('en-GB', { timeZone: c.localTime.timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    } catch {
      format = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    }
    const tick = () => {
      el.textContent = format.format(new Date())
    }
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [c.localTime.timeZone])

  useGsap(
    () => {
      const section = root.current
      const word = wordRef.current
      if (!section || !word) return
      if (prefersReducedMotion()) return

      gsap.fromTo(
        '.contact__title .char',
        { yPercent: 118, rotationX: -100, transformOrigin: '50% 100%', transformPerspective: 600 },
        { yPercent: 0, rotationX: 0, duration: 1.25, ease: 'expo.out', stagger: 0.032, scrollTrigger: { trigger: '.contact__title', start: 'top 82%', once: true } },
      )
      // Giant wordmark rises letter by letter as the page bottoms out.
      gsap.fromTo(
        '.contact__mark .char__in',
        { yPercent: 108 },
        { yPercent: 0, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: '.contact__mark', start: 'top bottom', end: 'bottom bottom', scrub: 0.8 } },
      )
      gsap.fromTo('.contact__reveal', { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: '.contact__animated', start: 'top 88%', once: true } })

      // Typewriter loop through the rotating words; only runs while visible.
      const tl = gsap.timeline({ repeat: -1, paused: true })
      c.animated.words.forEach((text) => {
        const state = { n: 0 }
        const render = () => {
          word.textContent = text.slice(0, Math.round(state.n))
        }
        tl.fromTo(state, { n: 0 }, { n: text.length, duration: text.length * 0.065, ease: `steps(${text.length})`, onUpdate: render, immediateRender: false })
          .to({}, { duration: 1.8 })
          .to(state, { n: 0, duration: text.length * 0.03, ease: `steps(${text.length})`, onUpdate: render })
          .to({}, { duration: 0.25 })
      })
      ScrollTrigger.create({
        trigger: section,
        start: 'top 85%',
        end: 'bottom top',
        onToggle: (self) => (self.isActive ? tl.play() : tl.pause()),
      })
    },
    root,
    [],
  )

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  const onCopy = async () => {
    const ok = await copyText(c.email)
    play('pop', { volume: 0.7 })
    setCopied(ok)
    emit('toast', ok ? c.actions.copied : c.email)
  }

  const titleWords = c.title.split(' ')

  return (
    <section ref={root} id="contact" className="contact" data-hud="dark" aria-labelledby="contact-title">
      <div className="contact__aurora" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <p className="contact__badge">
        <span className="contact__pulse" aria-hidden="true" />
        {c.availability}
      </p>

      <h2 id="contact-title" className="contact__title" aria-label={c.title}>
        {titleWords.map((wordText, i) => {
          const last = i === titleWords.length - 1
          const dot = last && wordText.endsWith('.')
          return (
            <span key={`${wordText}-${i}`} className="contact__word" aria-hidden="true">
              <Chars text={dot ? wordText.slice(0, -1) : wordText} sr={false} tail={dot ? <span className="char accent">.</span> : undefined} />
            </span>
          )
        })}
      </h2>

      <p className="contact__animated">
        <span className="visually-hidden">
          {c.animated.lead} {c.animated.words[0]}
        </span>
        <span aria-hidden="true">
          {c.animated.lead}{' '}
          <span className="contact__type">
            <span ref={wordRef}>{c.animated.words[0]}</span>
            <i className="contact__caret" />
          </span>
        </span>
      </p>

      <div className="contact__grid">
        <div className="contact__cell contact__reveal">
          <span className="contact__label mono">Role</span>
          <span className="contact__value">{c.role}</span>
          <span className="contact__label contact__label--next mono">{c.localTime.label}</span>
          <span className="contact__value contact__clock">
            <span ref={clockRef} className="mono">
              --:--:--
            </span>
            <small className="mono">{c.localTime.zone}</small>
          </span>
        </div>
        <div className="contact__cell contact__reveal">
          <span className="contact__label mono">Email</span>
          <a className="contact__value contact__link" href={`mailto:${c.email}`}>
            {c.email}
          </a>
        </div>
        <ul className="contact__cell contact__socials contact__reveal" aria-label="Social profiles">
          {c.socials.map((s) => (
            <li key={s.id}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="social">
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path d={ICONS[s.id]} />
                </svg>
                <span className="social__label">{s.label}</span>
                <span className="social__handle mono">{s.handle}</span>
                <span className="social__arrow" aria-hidden="true">
                  ↗
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="contact__actions contact__reveal">
        <a className="btn btn--primary btn--lg" href={`mailto:${c.email}`} data-magnetic>
          {c.actions.email} <span className="btn__arrow" aria-hidden="true">↗</span>
        </a>
        <button type="button" className="btn btn--ghost-dark btn--lg" onClick={onCopy} data-magnetic>
          {copied ? c.actions.copied : c.actions.copy}
        </button>
        <button type="button" className="btn btn--ghost-dark btn--lg" onClick={() => scrollToSection('top')} data-magnetic>
          {c.actions.top} <span aria-hidden="true">↑</span>
        </button>
      </div>

      <footer className="contact__footer mono">
        <span>
          © {site.year} {site.brand}
        </span>
        <span>{c.footer}</span>
      </footer>

      <div className="contact__mark" aria-hidden="true">
        <Chars text={site.brand} nested sr={false} />
      </div>
    </section>
  )
}
