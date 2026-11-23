import { useCallback, useEffect, useRef, useState } from 'react'
import { site } from '../data/site'
import { emit } from '../lib/bus'
import { gsap, prefersReducedMotion, scrollToY, type ScrollTrigger, useGsap } from '../lib/scroll'
import { play } from '../lib/sound'
import { CursorArrow } from './Hero'

/**
 * Pinned "Developer mode" scene. Scroll scrubs a fake cursor that flips the
 * switch; the real switch is clickable too (it scrolls the scene to the
 * matching state). The scene ends with a circular reveal into the next section.
 */
export function Toggle() {
  const t = site.toggle
  const root = useRef<HTMLElement>(null)
  const [isOn, setIsOn] = useState(false)
  const onRef = useRef(false)
  const triggerRef = useRef<ScrollTrigger | null>(null)
  const firstRender = useRef(true)
  const [reduce] = useState(prefersReducedMotion)

  const apply = useCallback((next: boolean) => {
    if (onRef.current === next) return
    onRef.current = next
    setIsOn(next)
  }, [])

  useGsap(
    () => {
      const section = root.current
      if (!section || reduce) return
      const q = gsap.utils.selector(section)
      const sw = q('.switch')[0] as HTMLElement

      const setOrigin = () => {
        const s = section.getBoundingClientRect()
        const r = sw.getBoundingClientRect()
        section.style.setProperty('--rx', `${(((r.left + r.width / 2 - s.left) / s.width) * 100).toFixed(2)}%`)
        section.style.setProperty('--ry', `${(((r.top + r.height / 2 - s.top) / s.height) * 100).toFixed(2)}%`)
      }

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${Math.round(window.innerHeight * 1.8)}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onRefresh: setOrigin,
          onUpdate: (self) => {
            if (!self.isActive) return
            apply(self.progress > 0.36)
            const tone = self.progress > 0.84 ? 'light' : 'dark'
            if (section.dataset.hud !== tone) {
              section.dataset.hud = tone
              emit('hud:refresh')
            }
          },
          onLeaveBack: () => apply(false),
        },
      })
      triggerRef.current = tl.scrollTrigger ?? null
      setOrigin()

      tl.fromTo('.toggle__cursor', { x: '24vw', y: '22vh', autoAlpha: 0 }, { x: 0, y: 0, autoAlpha: 1, duration: 0.3, ease: 'power2.out' }, 0)
        .to('.toggle__cursor', { scale: 0.84, duration: 0.03, yoyo: true, repeat: 1, ease: 'power1.inOut' }, 0.33)
        .to('.toggle__cursor', { x: '-16vw', y: '-12vh', autoAlpha: 0, duration: 0.2, ease: 'power2.in' }, 0.5)
        .fromTo('.toggle__code li', { autoAlpha: 0, x: -16 }, { autoAlpha: 1, x: 0, duration: 0.06, stagger: 0.03 }, 0.4)
        .to('.toggle__inner', { scale: 0.9, autoAlpha: 0, duration: 0.24, ease: 'power2.in' }, 0.72)
        .fromTo('.toggle__reveal', { '--r': 0 }, { '--r': 150, duration: 0.26, ease: 'power2.in' }, 0.74)
        .to({}, { duration: 0.001 }, 1)

      return () => {
        triggerRef.current = null
      }
    },
    root,
    [],
  )

  // Spring the thumb whenever the state changes.
  useEffect(() => {
    const section = root.current
    const track = section?.querySelector<HTMLElement>('.switch__track')
    const thumb = section?.querySelector<HTMLElement>('.switch__thumb')
    if (!track || !thumb) return
    const travel = () => track.clientWidth - thumb.offsetWidth - thumb.offsetLeft * 2
    if (firstRender.current || reduce) {
      gsap.set(thumb, { x: isOn ? travel() : 0 })
    } else {
      play('toggle')
      gsap.to(thumb, { x: isOn ? travel() : 0, duration: 0.9, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' })
      gsap.fromTo(thumb, { scaleX: 1, scaleY: 1 }, { scaleX: 1.32, scaleY: 0.86, duration: 0.13, yoyo: true, repeat: 1, ease: 'power2.out' })
    }
    firstRender.current = false
    const onResize = () => gsap.set(thumb, { x: onRef.current ? travel() : 0 })
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      gsap.killTweensOf(thumb)
    }
  }, [isOn, reduce])

  const flip = () => {
    const next = !onRef.current
    const st = triggerRef.current
    if (st && !reduce) scrollToY(st.start + (st.end - st.start) * (next ? 0.5 : 0.12), { duration: 1.1 })
    else apply(next)
  }

  return (
    <section ref={root} id="developer-mode" className={`toggle${isOn ? ' is-on' : ''}`} data-hud="dark" aria-labelledby="toggle-title">
      <div className="toggle__inner">
        <p className="eyebrow eyebrow--light">{t.eyebrow}</p>
        <h2 id="toggle-title" className="visually-hidden">
          {t.title}
        </h2>

        <div className="toggle__stage">
          <p className="toggle__copy" aria-live="polite">
            <span className="toggle__line toggle__line--off" aria-hidden={isOn}>
              {t.off}
            </span>
            <span className="toggle__line toggle__line--on" aria-hidden={!isOn}>
              {t.on}
            </span>
          </p>

          <div className="toggle__control">
            <button type="button" role="switch" aria-checked={isOn} className="switch" onClick={flip} data-cursor="Toggle">
              <span className="visually-hidden">{t.switchLabel}</span>
              <span className="switch__track" aria-hidden="true">
                <span className="switch__thumb" />
              </span>
            </button>
            <span className="toggle__caption mono">{t.caption}</span>
            <span className="figma-cursor toggle__cursor" aria-hidden="true">
              <CursorArrow />
              <span className="figma-cursor__label">{site.hero.cursorName}</span>
            </span>
          </div>

          <div className="specimen" aria-hidden="true">
            <span className="specimen__label mono">{t.specimen.label}</span>
            <div className="specimen__card">
              <span className="specimen__avatar" />
              <span className="specimen__title">{t.specimen.title}</span>
              <span className="specimen__meta">{t.specimen.meta}</span>
              <span className="specimen__bar">
                <i />
              </span>
              <span className="specimen__action">{t.specimen.action}</span>
            </div>
            <ul className="toggle__code mono">
              {t.specimen.code.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="toggle__reveal" aria-hidden="true" />
    </section>
  )
}
