import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { site, type SectionId } from '../data/site'
import { works } from '../data/works'
import { copyText, emit, on, requestReplay } from '../lib/bus'
import { lockScroll, unlockScroll, useGoTo } from '../lib/scroll'
import { play, toggleSound, useSoundEnabled } from '../lib/sound'

type Group = keyof typeof site.palette.groups

interface Command {
  id: string
  group: Group
  label: string
  hint?: string
  keywords?: string
  run: () => void
}

const GROUP_ORDER: Group[] = ['navigate', 'projects', 'actions', 'links']

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const listId = useId()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const goTo = useGoTo()
  const sound = useSoundEnabled()
  const p = site.palette

  const commands = useMemo<Command[]>(() => {
    const sections = Object.entries(p.sections) as Array<[SectionId, string]>
    return [
      ...sections.map(([id, label]) => ({
        id: `nav-${id}`,
        group: 'navigate' as const,
        label,
        hint: id === 'top' ? '/' : `#${id}`,
        run: () => goTo(id),
      })),
      ...works.map((w) => ({
        id: `work-${w.slug}`,
        group: 'projects' as const,
        label: w.title,
        hint: w.category,
        keywords: `${w.filters.join(' ')} ${w.kind} project case study`,
        run: () => navigate(`/works/${w.slug}`),
      })),
      {
        id: 'sound',
        group: 'actions',
        label: sound ? p.actions.soundOff : p.actions.soundOn,
        hint: 'audio',
        keywords: 'sound mute audio',
        run: toggleSound,
      },
      {
        id: 'copy-email',
        group: 'actions',
        label: p.actions.copyEmail,
        hint: site.contact.email,
        keywords: 'mail contact clipboard',
        run: () => {
          void copyText(site.contact.email).then((ok) => emit('toast', ok ? site.contact.actions.copied : site.contact.email))
        },
      },
      {
        id: 'replay',
        group: 'actions',
        label: p.actions.replay,
        hint: 'intro',
        keywords: 'intro hero animation restart',
        run: () => {
          if (pathname !== '/') navigate('/')
          requestReplay()
        },
      },
      ...site.contact.socials.map((s) => ({
        id: `link-${s.id}`,
        group: 'links' as const,
        label: `Open ${s.label}`,
        hint: s.handle,
        keywords: 'social profile',
        run: () => {
          window.open(s.url, '_blank', 'noopener,noreferrer')
        },
      })),
    ]
  }, [goTo, navigate, pathname, sound, p])

  const results = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
    const filtered = terms.length
      ? commands.filter((c) => {
          const hay = `${c.label} ${c.hint ?? ''} ${c.keywords ?? ''} ${p.groups[c.group]}`.toLowerCase()
          return terms.every((t) => hay.includes(t))
        })
      : commands
    return GROUP_ORDER.flatMap((g) => filtered.filter((c) => c.group === g))
  }, [commands, query, p])

  // Rows with group headers precomputed (no mutation during render).
  const rows = useMemo(
    () => results.map((cmd, i) => ({ cmd, header: i === 0 || results[i - 1].group !== cmd.group ? p.groups[cmd.group] : null })),
    [results, p],
  )

  const openRef = useRef(false)
  const show = useCallback(() => {
    setQuery('')
    setActive(0)
    setOpen(true)
  }, [])
  const close = useCallback(() => setOpen(false), [])

  // Global shortcut + programmatic open.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (openRef.current) close()
        else show()
      }
    }
    window.addEventListener('keydown', onKey)
    const off = on('palette:open', show)
    return () => {
      window.removeEventListener('keydown', onKey)
      off()
    }
  }, [show, close])

  useEffect(() => {
    openRef.current = open
    if (!open) return
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    lockScroll()
    play('pop', { volume: 0.7 })
    const raf = requestAnimationFrame(() => inputRef.current?.focus())
    return () => {
      cancelAnimationFrame(raf)
      unlockScroll()
      returnFocus.current?.focus({ preventScroll: true })
    }
  }, [open])

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active, results])

  const run = (cmd: Command | undefined) => {
    if (!cmd) return
    play('key', { volume: 0.8 })
    setOpen(false)
    // Let the palette release the scroll lock before the command scrolls.
    requestAnimationFrame(() => cmd.run())
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const n = results.length
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (n) setActive((i) => (i + 1) % n)
      play('tick', { volume: 0.35 })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (n) setActive((i) => (i - 1 + n) % n)
      play('tick', { volume: 0.35 })
    } else if (e.key === 'Enter') {
      e.preventDefault()
      run(results[active])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'Tab') {
      e.preventDefault()
    }
  }

  return (
    <div className={`palette${open ? ' is-open' : ''}`} inert={!open} aria-hidden={!open}>
      <div className="palette__backdrop" onClick={close} />
      <div className="palette__panel" role="dialog" aria-modal="true" aria-label="Command palette" data-lenis-prevent>
        <div className="palette__search">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20 L16 16" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            onKeyDown={onKeyDown}
            placeholder={p.placeholder}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-activedescendant={results[active] ? `${listId}-${results[active].id}` : undefined}
            aria-autocomplete="list"
            spellCheck={false}
            autoComplete="off"
          />
          <kbd>esc</kbd>
        </div>
        <ul ref={listRef} id={listId} className="palette__list" role="listbox" aria-label="Commands">
          {results.length === 0 && <li className="palette__empty">{p.empty}</li>}
          {rows.map(({ cmd, header }, i) => {
            return (
              <li key={cmd.id} role="presentation">
                {header && (
                  <span className="palette__group" aria-hidden="true">
                    {header}
                  </span>
                )}
                <div
                  id={`${listId}-${cmd.id}`}
                  role="option"
                  aria-selected={i === active}
                  className={`palette__item${i === active ? ' is-active' : ''}`}
                  onMouseMove={() => i !== active && setActive(i)}
                  onClick={() => run(cmd)}
                >
                  <span className="palette__label">{cmd.label}</span>
                  {cmd.hint && <span className="palette__hint">{cmd.hint}</span>}
                </div>
              </li>
            )
          })}
        </ul>
        <div className="palette__foot" aria-hidden="true">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> {p.hint}
          </span>
          <span>
            <kbd>↵</kbd> select
          </span>
          <span>
            <kbd>esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  )
}
