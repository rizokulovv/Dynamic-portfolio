import { Fragment, type ReactNode } from 'react'

interface CharsProps {
  text: string
  /** Wrap each glyph twice (`.char > .char__in`) so two tweens never fight over one transform. */
  nested?: boolean
  /** Extra class on every word wrapper. */
  wordClass?: string
  /** Render the plain string for screen readers (default). Disable when the parent already has an accessible name. */
  sr?: boolean
  /** Optional decoration rendered after the last glyph (e.g. an accent dot). */
  tail?: ReactNode
}

/**
 * Per-character markup for GSAP text reveals, rendered by React so no runtime
 * DOM splitting is needed. Words stay unbreakable; glyph spans are aria-hidden
 * and a visually-hidden copy carries the real text.
 */
export function Chars({ text, nested = false, wordClass, sr = true, tail }: CharsProps) {
  const words = text.split(' ')
  return (
    <>
      {sr && <span className="visually-hidden">{text}</span>}
      <span className="split" aria-hidden="true">
        {words.map((word, w) => (
          <Fragment key={w}>
            <span className={wordClass ? `split__word ${wordClass}` : 'split__word'}>
              {[...word].map((glyph, i) => (
                <span key={i} className="char">
                  {nested ? <span className="char__in">{glyph}</span> : glyph}
                </span>
              ))}
              {w === words.length - 1 && tail}
            </span>
            {w < words.length - 1 && ' '}
          </Fragment>
        ))}
      </span>
    </>
  )
}
