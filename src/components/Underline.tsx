import { useMemo } from 'react'
import { scribblePath } from '../lib/draw'

interface UnderlineProps {
  /** Different seeds give each underline its own hand-drawn wobble. */
  seed?: number
  className?: string
}

/**
 * Violet marker underline. The path uses pathLength="1", so parents draw it by
 * tweening `stroke-dashoffset` from 1 → 0 (or by adding `.is-drawn` for CSS).
 */
export function Underline({ seed = 1, className = '' }: UnderlineProps) {
  const d = useMemo(() => scribblePath(300, 28, seed), [seed])
  return (
    <svg className={`underline ${className}`} viewBox="0 0 300 28" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d={d} pathLength={1} />
    </svg>
  )
}
