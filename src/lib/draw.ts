/**
 * SVG stroke-drawing helpers.
 *
 * Paths are normalised with pathLength="1", so a stroke is fully hidden at
 * strokeDashoffset 1 and fully drawn at 0 regardless of its real length.
 * The dash array is "1 2" (not "1 1") so round caps never leave a stray dot.
 */

export function prepareStroke(path: SVGGeometryElement): void {
  path.setAttribute('pathLength', '1')
  path.style.strokeDasharray = '1 2'
  path.style.strokeDashoffset = '1'
}

export interface Point {
  x: number
  y: number
}

/** Returns a sampler mapping progress 0..1 → point on the path (user units). */
export function pathSampler(path: SVGGeometryElement): (progress: number) => Point {
  const length = path.getTotalLength()
  return (progress) => {
    const p = path.getPointAtLength(length * Math.min(1, Math.max(0, progress)))
    return { x: p.x, y: p.y }
  }
}

/** Deterministic PRNG so hand-drawn shapes look the same on every render. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * A marker-style underline: one confident stroke that overshoots, then a
 * short return flick — like a quick annotation in a design file.
 */
export function scribblePath(width = 300, height = 28, seed = 1): string {
  const r = mulberry32(seed * 9973)
  const j = (n: number) => (r() - 0.5) * n
  const y0 = height * 0.55 + j(4)
  const y1 = height * 0.42 + j(4)
  const x1 = width - 4
  const main = `M 4 ${y0.toFixed(1)} C ${(width * 0.28).toFixed(1)} ${(y0 - 7 + j(4)).toFixed(1)}, ${(width * 0.62).toFixed(1)} ${(y1 + 6 + j(4)).toFixed(1)}, ${x1} ${y1.toFixed(1)}`
  const tail = ` C ${(width * 0.72).toFixed(1)} ${(y1 + 6 + j(3)).toFixed(1)}, ${(width * 0.4).toFixed(1)} ${(height * 0.78 + j(3)).toFixed(1)}, ${(width * 0.16 + j(10)).toFixed(1)} ${(height - 3).toFixed(1)}`
  return main + tail
}
