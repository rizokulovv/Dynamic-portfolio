/**
 * Tiny typed event bus (window CustomEvents) for cross-tree signals that don't
 * belong in React state — e.g. the command palette asking the hero to replay.
 */
export interface BusEvents {
  'intro:replay': undefined
  'intro:state': 'playing' | 'done'
  'hud:refresh': undefined
  'palette:open': undefined
  toast: string
}

const PREFIX = 'daler:'

export function emit<K extends keyof BusEvents>(
  type: K,
  ...detail: BusEvents[K] extends undefined ? [] : [BusEvents[K]]
): void {
  window.dispatchEvent(new CustomEvent(PREFIX + type, { detail: detail[0] }))
}

export function on<K extends keyof BusEvents>(type: K, handler: (detail: BusEvents[K]) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<BusEvents[K]>).detail)
  window.addEventListener(PREFIX + type, listener)
  return () => window.removeEventListener(PREFIX + type, listener)
}

// Last known intro state — the HUD mounts after the hero starts playing.
let introState: BusEvents['intro:state'] = 'done'
export const getIntroState = (): BusEvents['intro:state'] => introState
export const subscribeIntro = (listener: () => void): (() => void) => on('intro:state', listener)
export function setIntroState(state: BusEvents['intro:state']): void {
  introState = state
  emit('intro:state', state)
}

// A replay can be requested from another route; the hero consumes it on mount.
let replayPending = false
export function requestReplay(): void {
  replayPending = true
  emit('intro:replay')
}
export function consumeReplay(): boolean {
  const pending = replayPending
  replayPending = false
  return pending
}

/** Copy text to the clipboard with a legacy fallback. Resolves true on success. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
    document.body.appendChild(area)
    area.select()
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {
      ok = false
    }
    area.remove()
    return ok
  }
}
