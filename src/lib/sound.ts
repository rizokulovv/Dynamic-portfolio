import { useSyncExternalStore } from 'react'

/**
 * Opt-in interface sound.
 *
 *  • OFF by default; the preference persists in localStorage.
 *  • The AudioContext is only created inside a user gesture (enable click, or
 *    the first pointer/key event when the stored preference is "on"), so
 *    nothing can ever autoplay.
 *  • Buffers are fetched lazily the first time sound is unlocked.
 */
export type SoundName = 'key' | 'key2' | 'pop' | 'tick' | 'toggle' | 'whoosh' | 'swell'

const NAMES: SoundName[] = ['key', 'key2', 'pop', 'tick', 'toggle', 'whoosh', 'swell']
const PREF_KEY = 'daler:sound'
const GATE_KEY = 'daler:sound-gate'

const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
const write = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* storage unavailable (private mode) — preference lasts for this visit only */
  }
}

let enabled = read(PREF_KEY) === 'on'
let gateOpen = read(GATE_KEY) !== 'done'
let ctx: AudioContext | null = null
let master: GainNode | null = null
let loading: Promise<void> | null = null
const buffers = new Map<SoundName, AudioBuffer>()
const listeners = new Set<() => void>()
let gateWaiters: Array<() => void> = []

const notify = () => listeners.forEach((l) => l())

/** Must run inside a user gesture. */
function unlock(): void {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    ctx = new Ctor()
    master = ctx.createGain()
    master.gain.value = 0.5
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  void load()
}

function load(): Promise<void> {
  if (loading || !ctx) return loading ?? Promise.resolve()
  const audio = ctx
  loading = Promise.all(
    NAMES.map(async (name) => {
      const res = await fetch(`/audio/${name}.mp3`)
      const data = await res.arrayBuffer()
      buffers.set(name, await audio.decodeAudioData(data))
    }),
  )
    .then(() => undefined)
    .catch(() => {
      loading = null
    })
  return loading
}

export function play(name: SoundName, opts: { volume?: number; rate?: number } = {}): void {
  if (!enabled || !ctx || !master || ctx.state !== 'running') return
  const buffer = buffers.get(name)
  if (!buffer) return
  const src = ctx.createBufferSource()
  src.buffer = buffer
  // ±3 % pitch jitter keeps repeated sounds from feeling mechanical.
  src.playbackRate.value = (opts.rate ?? 1) * (1 + (Math.random() - 0.5) * 0.06)
  const gain = ctx.createGain()
  gain.gain.value = opts.volume ?? 1
  src.connect(gain).connect(master)
  src.start()
}

/** Call from a click/keydown handler. */
export function setSound(on: boolean): void {
  enabled = on
  write(PREF_KEY, on ? 'on' : 'off')
  if (on) {
    unlock()
    void load().then(() => play('toggle', { volume: 0.8 }))
  }
  notify()
}

export const toggleSound = (): void => setSound(!enabled)
export const isSoundOn = (): boolean => enabled

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useSoundEnabled = (): boolean => useSyncExternalStore(subscribe, isSoundOn)

// ── First-visit gate ──────────────────────────────────────────────────────────
export const isGateOpen = (): boolean => gateOpen
export const useSoundGate = (): boolean => useSyncExternalStore(subscribe, isGateOpen)

export function resolveGate(enable: boolean): void {
  gateOpen = false
  write(GATE_KEY, 'done')
  setSound(enable)
  gateWaiters.forEach((resolve) => resolve())
  gateWaiters = []
}

export function whenGateResolved(): Promise<void> {
  return gateOpen ? new Promise((resolve) => gateWaiters.push(resolve)) : Promise.resolve()
}

// Returning visitors who opted in: unlock on their first real gesture.
function onFirstGesture(): void {
  if (enabled) unlock()
  window.removeEventListener('pointerdown', onFirstGesture)
  window.removeEventListener('keydown', onFirstGesture)
}
window.addEventListener('pointerdown', onFirstGesture)
window.addEventListener('keydown', onFirstGesture)
