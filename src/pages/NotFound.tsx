import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { site } from '../data/site'
import { CursorArrow } from '../sections/Hero'

/** Custom 404 — an empty frame on the canvas. */
export function NotFound() {
  const n = site.notFound
  const { pathname } = useLocation()

  useEffect(() => {
    document.title = `${n.code} — ${n.title} · ${site.brand}`
  }, [n])

  return (
    <main id="main" className="notfound" data-hud="light">
      <div className="notfound__frame">
        <span className="notfound__tag mono">{pathname}</span>
        <i className="h tl" />
        <i className="h tr" />
        <i className="h bl" />
        <i className="h br" />
        <p className="notfound__code" aria-hidden="true">
          {n.code}
        </p>
        <h1 className="notfound__title">{n.title}</h1>
        <p className="notfound__body">{n.body}</p>
        <Link to="/" className="btn btn--primary">
          {n.action} <span className="btn__arrow" aria-hidden="true">↗</span>
        </Link>
        <span className="figma-cursor notfound__cursor" aria-hidden="true">
          <CursorArrow />
          <span className="figma-cursor__label">{site.hero.cursorName}</span>
        </span>
      </div>
    </main>
  )
}
