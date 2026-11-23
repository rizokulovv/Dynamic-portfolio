import { useRef, type MouseEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { silhouette } from '../data/silhouette'
import { site, type SectionId } from '../data/site'
import { consumeReplay, emit, on, setIntroState } from '../lib/bus'
import { pathSampler, prepareStroke } from '../lib/draw'
import { motionBlur } from '../lib/motionblur'
import { gsap, lockScroll, prefersReducedMotion, scrollToY, unlockScroll, useGoTo, useGsap } from '../lib/scroll'
import { isGateOpen, play, whenGateResolved } from '../lib/sound'

/** The intro plays automatically once per page load; replay via ⌘K. */
let introSeen = false

const COLORS = { night: '#07070b', paper: '#fafafc', ink: '#0b0b0f' }
const HANDLES = ['tl', 't', 'tr', 'r', 'br', 'b', 'bl', 'l'] as const
const SKIP_KEYS = new Set(['ArrowDown', 'PageDown', ' ', 'End', 'Escape'])

export function CursorArrow() {
  return (
    <svg className="figma-cursor__arrow" viewBox="0 0 20 22" width="20" height="22" aria-hidden="true">
      <path d="M2 2 L18 9.5 L10.6 11.4 L7.4 19 Z" />
    </svg>
  )
}

/**
 * Cinematic hero — a designer building an identity inside a design tool.
 *   Stage A (0 – 2.9 s)  dark canvas, guides, typed HELLO, canvas flip, selection frame
 *   Stage B (2.9 – 5.1 s) vector trace with pen cursor + live point counter, fill
 *   Stage C (5.1 – 7.6 s) figure moves right, I'M / DALER slide-in, dot pop, copy, CTAs
 * The final state is the CSS default, so reduced-motion users get it instantly.
 */
export function Hero() {
  const h = site.hero
  const root = useRef<HTMLElement>(null)
  const { hash } = useLocation()
  const goTo = useGoTo()

  useGsap(
    () => {
      const section = root.current
      if (!section) return
      const q = gsap.utils.selector(section)
      const one = <T extends Element = HTMLElement>(sel: string) => section.querySelector(sel) as T
      const stroke = one<SVGPathElement>('.sil__stroke')
      const pen = one<SVGGElement>('.sil__pen')
      const counter = one('.sil__count')
      const anchors = q('.sil__anchor') as Element[]
      const figure = one('.hero__figure')
      const wrap = one('.hero__figure-wrap')
      const name = one('.hero__name-text')
      const dims = one('.sel__dims')
      const box = one('.hello__box')
      const skipBtn = one<HTMLButtonElement>('.hero__skip')
      const reduce = prefersReducedMotion()
      let alive = true
      let playing = false

      prepareStroke(stroke)
      const sample = pathSampler(stroke)
      const nameBlur = motionBlur(name, 'x')

      // ── live renderers (also called directly when the timeline is skipped) ──
      const trace = { p: 0 }
      const renderTrace = () => {
        stroke.style.strokeDashoffset = String(1 - trace.p)
        const pt = sample(trace.p)
        pen.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`)
        counter.textContent = String(Math.round(trace.p * silhouette.points))
        anchors.forEach((a, i) => a.classList.toggle('is-on', (i + 0.5) / anchors.length <= trace.p))
      }
      // Caret follows the last typed glyph (glyphs keep their width while hidden).
      const chars = q('.hello__char') as HTMLElement[]
      const caret = one('.hello__caret')
      const moveCaret = (n: number) => {
        const last = chars[n - 1]
        gsap.set(caret, { x: last ? last.offsetLeft + last.offsetWidth : 0 })
      }
      const size = { w: 0, h: 0 }
      const renderDims = () => {
        dims.textContent = `${Math.round(size.w)} × ${Math.round(size.h)}`
      }
      // Figure starts centred + enlarged, then glides to its CSS position.
      let offset = { x: 0, y: 0, s: 1 }
      const measure = () => {
        const s = section.getBoundingClientRect()
        const r = wrap.getBoundingClientRect()
        offset = {
          x: s.left + s.width / 2 - (r.left + r.width / 2),
          y: s.top + s.height / 2 - (r.top + r.height / 2),
          s: Math.min(1.6, Math.max(0.7, (s.height * 0.66) / Math.max(1, r.height))),
        }
      }
      const move = { t: 0 }
      const renderMove = () => {
        const k = 1 - move.t
        gsap.set(figure, { x: offset.x * k, y: offset.y * k, scale: 1 + (offset.s - 1) * k })
      }
      const viewport = () => {
        const vp = `${window.innerWidth} × ${window.innerHeight}`
        q('.hero__vp').forEach((n) => (n.textContent = vp))
        q('.hero__gx').forEach((n) => (n.textContent = String(Math.round(window.innerWidth / 2))))
        q('.hero__gy').forEach((n) => (n.textContent = String(Math.round(window.innerHeight / 2))))
      }
      viewport()

      // ── timeline ────────────────────────────────────────────────────────────
      const tl = gsap.timeline({ paused: true, onComplete: () => finish() })

      // Stage A — canvas, guides, typing, flip, selection
      tl.fromTo(q('.guide--h'), { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'expo.inOut', stagger: 0.08 }, 0)
        .fromTo(q('.guide--v'), { scaleY: 0 }, { scaleY: 1, duration: 0.9, ease: 'expo.inOut', stagger: 0.08 }, 0.05)
        .fromTo(q('.guide__label'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, stagger: 0.06 }, 0.5)
      chars.forEach((char, i) => {
        const at = 0.35 + i * 0.2
        tl.fromTo(char, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.001 }, at)
          .call(moveCaret, [i + 1], at)
          .call(play, [i % 2 ? 'key2' : 'key'], at)
      })
      tl.fromTo(section, { '--hero-bg': COLORS.night, '--hero-fg': COLORS.paper }, { '--hero-bg': COLORS.paper, '--hero-fg': COLORS.ink, duration: 0.45, ease: 'power2.inOut' }, 1.55)
        .call(() => {
          section.dataset.hud = 'light'
          emit('hud:refresh')
        }, [], 1.75)
        .fromTo(q('.sel'), { autoAlpha: 0, scale: 1.08 }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'back.out(2)' }, 1.9)
        .fromTo(q('.sel__handle'), { scale: 0 }, { scale: 1, duration: 0.35, ease: 'back.out(3)', stagger: 0.03 }, 1.98)
        .fromTo(size, { w: 0, h: 0 }, { w: () => box.offsetWidth, h: () => box.offsetHeight, duration: 0.8, ease: 'power2.out', onUpdate: renderDims }, 1.98)
        .call(play, ['pop', { volume: 0.5 }], 1.92)
        .fromTo(q('.hello__cursor'), { x: 180, y: 140, autoAlpha: 0 }, { x: 0, y: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out' }, 2.1)
        .to(q('.hello__cursor'), { x: 10, y: 6, duration: 0.18, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 2.75)
        .fromTo(q('.hero__hello'), { autoAlpha: 1, y: 0, scale: 1 }, { autoAlpha: 0, y: -48, scale: 0.94, duration: 0.45, ease: 'power2.in' }, 2.95)

      // Stage B — vector trace
      tl.fromTo(figure, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, 2.98)
        .fromTo(q('.sil__hud'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 3.0)
        .fromTo(q('.sil__anchors'), { autoAlpha: 1 }, { autoAlpha: 1, duration: 0.01 }, 3.0)
        .fromTo(pen, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 3.0)
        .fromTo(trace, { p: 0 }, { p: 1, duration: 1.7, ease: 'power1.inOut', onUpdate: renderTrace }, 3.0)
        .call(play, ['swell', { volume: 0.7 }], 3.0)
        .fromTo(q('.sil__fill'), { fillOpacity: 0 }, { fillOpacity: 1, duration: 0.5, ease: 'power2.out' }, 4.55)
        .call(play, ['pop'], 4.6)
        .to(pen, { autoAlpha: 0, duration: 0.25, immediateRender: false }, 4.7)
        .to(q('.sil__anchors'), { autoAlpha: 0, duration: 0.4, immediateRender: false }, 4.75)
        .to(q('.sil__hud'), { autoAlpha: 0, duration: 0.3, immediateRender: false }, 4.9)

      // Stage C — composition
      tl.fromTo(move, { t: 0 }, { t: 1, duration: 0.85, ease: 'expo.inOut', onUpdate: renderMove }, 5.05)
        .fromTo(q('.hero__pre > span'), { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: 'expo.out' }, 5.35)
        .call(play, ['whoosh'], 5.5)
        .fromTo(name, { xPercent: -45, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 0.9, ease: 'expo.out' }, 5.55)
        .fromTo(nameBlur, { amount: 44 }, { amount: 0, duration: 0.85, ease: 'power3.out' }, 5.55)
        .fromTo(q('.hero__dot'), { scale: 0 }, { scale: 1, duration: 0.7, ease: 'elastic.out(1.1, 0.4)' }, 6.25)
        .call(play, ['pop'], 6.25)
        .fromTo(q('.hero__role-line'), { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'expo.inOut' }, 6.45)
        .fromTo(q('.hero__role-text'), { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: 0.5 }, 6.6)
        .fromTo(q('.hero__intro'), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 6.8)
        .fromTo(q('.hero__ctas > *'), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out' }, 7.0)
        .fromTo(q('.hero__meta, .hero__frame, .hero__scroll'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, stagger: 0.05 }, 7.0)
        .fromTo(skipBtn, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, immediateRender: false }, 7.2)

      // ── state machine ─────────────────────────────────────────────────────
      const setPlaying = (value: boolean) => {
        if (value === playing) return
        playing = value
        section.classList.toggle('is-playing', value)
        setIntroState(value ? 'playing' : 'done')
        if (value) lockScroll()
        else unlockScroll()
      }
      const finish = () => {
        moveCaret(chars.length)
        renderTrace()
        renderDims()
        renderMove()
        section.dataset.hud = 'light'
        emit('hud:refresh')
        setPlaying(false)
      }
      const jumpToEnd = () => {
        tl.progress(1, true)
        finish()
      }
      const skip = () => {
        if (!playing) return
        play('tick')
        jumpToEnd()
      }
      const start = async (fromReplay: boolean, delay = 0) => {
        if (reduce) {
          jumpToEnd()
          return
        }
        if (fromReplay) scrollToY(0, { immediate: true })
        tl.pause(0)
        moveCaret(0)
        trace.p = 0
        move.t = 0
        measure()
        renderMove()
        renderTrace()
        section.dataset.hud = 'dark'
        emit('hud:refresh')
        setPlaying(true)
        await whenGateResolved()
        await document.fonts.ready
        if (delay) await new Promise((resolve) => window.setTimeout(resolve, delay))
        if (!alive || !playing) return
        measure()
        renderMove()
        tl.play(0)
      }

      if (consumeReplay()) void start(true, 900)
      else if (!introSeen && !hash && !reduce) void start(false)
      else jumpToEnd()
      introSeen = true

      // ── listeners ────────────────────────────────────────────────────────
      const offReplay = on('intro:replay', () => {
        if (consumeReplay()) void start(true)
      })
      const intent = (e: Event) => {
        if (!playing || isGateOpen()) return
        if (e instanceof KeyboardEvent && !SKIP_KEYS.has(e.key)) return
        skip()
      }
      const onResize = () => {
        viewport()
        if (!playing) return
        measure()
        renderMove()
      }
      skipBtn.addEventListener('click', skip)
      window.addEventListener('wheel', intent, { passive: true })
      window.addEventListener('touchmove', intent, { passive: true })
      window.addEventListener('keydown', intent)
      window.addEventListener('resize', onResize)

      // ── after the intro: gentle scroll parallax ───────────────────────────
      if (!reduce) {
        gsap.to(wrap, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true } })
        gsap.to(q('.hero__content'), {
          yPercent: -12,
          autoAlpha: 0.2,
          ease: 'none',
          scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true },
        })
      }

      return () => {
        alive = false
        offReplay()
        skipBtn.removeEventListener('click', skip)
        window.removeEventListener('wheel', intent)
        window.removeEventListener('touchmove', intent)
        window.removeEventListener('keydown', intent)
        window.removeEventListener('resize', onResize)
        nameBlur.destroy()
        if (playing) {
          playing = false
          unlockScroll()
          setIntroState('done')
        }
      }
    },
    root,
    [],
  )

  const jump = (id: SectionId) => (e: MouseEvent) => {
    e.preventDefault()
    play('tick', { volume: 0.6 })
    goTo(id)
  }

  return (
    <section ref={root} id="top" className="hero" data-hud="light" aria-labelledby="hero-title">
      <div className="hero__guides" aria-hidden="true">
        <span className="guide guide--h guide--h1" />
        <span className="guide guide--h guide--h2" />
        <span className="guide guide--v guide--v1" />
        <span className="guide guide--v guide--v2" />
        <span className="guide__label guide__label--x">
          X <b className="hero__gx">0</b>
        </span>
        <span className="guide__label guide__label--y">
          Y <b className="hero__gy">0</b>
        </span>
      </div>

      <div className="hero__hello" aria-hidden="true">
        <div className="hello__box">
          <span className="hello__text">
            {[...h.greeting].map((char, i) => (
              <span key={i} className="hello__char">
                {char}
              </span>
            ))}
            <span className="hello__caret" />
          </span>
          <span className="sel">
            {HANDLES.map((p) => (
              <i key={p} className={`sel__handle sel__handle--${p}`} />
            ))}
            <span className="sel__dims">0 × 0</span>
          </span>
          <span className="figma-cursor hello__cursor">
            <CursorArrow />
            <span className="figma-cursor__label">{h.cursorName}</span>
          </span>
        </div>
      </div>

      <div className="hero__figure-wrap" data-hud="dark" style={{ aspectRatio: `${silhouette.width} / ${silhouette.height}` }}>
        <div className="hero__figure">
          <span className="sil__hud" aria-hidden="true">
            <span>{h.layerLabel}</span>
            <span>
              <b className="sil__count">{silhouette.points}</b> / {silhouette.points} pts
            </span>
          </span>
          <svg className="sil" viewBox={silhouette.viewBox} role="img" aria-label={h.figureAlt}>
            <path className="sil__fill" d={silhouette.d} />
            <path className="sil__stroke" d={silhouette.d} />
            <g className="sil__anchors">
              {silhouette.anchors.map(([x, y], i) => (
                <rect key={i} className="sil__anchor" x={x - 7} y={y - 7} width={14} height={14} />
              ))}
            </g>
            <g className="sil__pen">
              <path className="sil__pen-nib" d="M0 0 L7 -24 L28 -46 L46 -28 L24 -7 Z" />
              <path className="sil__pen-slit" d="M0 0 L17 -17" />
              <circle className="sil__pen-hole" cx="18" cy="-18" r="4" />
            </g>
          </svg>
          <span className="hero__frame" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <span className="hero__frame-tag">{h.layerLabel}</span>
          </span>
        </div>
      </div>

      <div className="hero__content">
        <p className="hero__meta mono">
          <span className="hero__live" aria-hidden="true" />
          {h.frameLabel}
          <span className="hero__vp" aria-hidden="true" />
        </p>
        <h1 id="hero-title" className="hero__title">
          <span className="hero__pre">
            <span>{h.pretitle}</span>
          </span>
          <span className="hero__name">
            <span className="hero__name-text">{h.title}</span>
            <span className="hero__dot" aria-hidden="true" />
          </span>
        </h1>
        <p className="hero__role">
          <span className="hero__role-line" aria-hidden="true" />
          <span className="hero__role-text">{h.role}</span>
        </p>
        <p className="hero__intro">{h.intro}</p>
        <div className="hero__ctas">
          <a href={`/#${h.primary.target}`} className="btn btn--primary" onClick={jump(h.primary.target)}>
            {h.primary.label} <span className="btn__arrow" aria-hidden="true">↗</span>
          </a>
          <a href={`/#${h.secondary.target}`} className="btn btn--ghost" onClick={jump(h.secondary.target)}>
            {h.secondary.label}
          </a>
        </div>
      </div>

      <button type="button" className="hero__skip">
        {h.skip} <kbd>esc</kbd>
      </button>
      <span className="hero__scroll" aria-hidden="true">
        <i />
        {h.scrollHint}
      </span>
    </section>
  )
}
