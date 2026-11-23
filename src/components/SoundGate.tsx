import { useEffect, useRef, type KeyboardEvent } from 'react'
import { site } from '../data/site'
import { lockScroll, unlockScroll } from '../lib/scroll'
import { resolveGate, useSoundGate } from '../lib/sound'

/** First-visit prompt. Sound stays off unless the visitor explicitly opts in. */
export function SoundGate() {
  const open = useSoundGate()
  const enableRef = useRef<HTMLButtonElement>(null)
  const muteRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    lockScroll()
    enableRef.current?.focus()
    return () => unlockScroll()
  }, [open])

  if (!open) return null

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      resolveGate(false)
      return
    }
    if (e.key !== 'Tab') return
    // Two-button focus trap.
    const first = enableRef.current
    const last = muteRef.current
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last?.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first?.focus()
    }
  }

  const { title, body, enable, mute } = site.soundGate
  return (
    <div className="gate" role="dialog" aria-modal="true" aria-labelledby="gate-title" aria-describedby="gate-body" onKeyDown={onKeyDown}>
      <div className="gate__panel">
        <div className="gate__wave" aria-hidden="true">
          {Array.from({ length: 24 }, (_, i) => (
            <i key={i} style={{ animationDelay: `${(i % 6) * -0.13}s` }} />
          ))}
        </div>
        <h2 id="gate-title" className="gate__title">
          {title}
        </h2>
        <p id="gate-body" className="gate__body">
          {body}
        </p>
        <div className="gate__actions">
          <button ref={enableRef} type="button" className="btn btn--primary" onClick={() => resolveGate(true)}>
            {enable} <span className="btn__arrow" aria-hidden="true">↗</span>
          </button>
          <button ref={muteRef} type="button" className="btn btn--ghost-dark" onClick={() => resolveGate(false)}>
            {mute}
          </button>
        </div>
      </div>
    </div>
  )
}
