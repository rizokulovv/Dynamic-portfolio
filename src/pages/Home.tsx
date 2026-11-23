import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { site } from '../data/site'
import { ScrollTrigger, scrollToSection } from '../lib/scroll'
import { Contact } from '../sections/Contact'
import { Hero } from '../sections/Hero'
import { Process } from '../sections/Process'
import { Services } from '../sections/Services'
import { Stack } from '../sections/Stack'
import { Toggle } from '../sections/Toggle'
import { Works } from '../sections/Works'

export function Home() {
  const { hash } = useLocation()

  useEffect(() => {
    document.title = site.meta.title
  }, [])

  // Deep links like /#works: wait for fonts so pinned sections are measured
  // correctly, then jump. (Same-page hash changes are handled by Transition.)
  useEffect(() => {
    const id = hash.slice(1)
    if (!id) return
    let cancelled = false
    void document.fonts.ready.then(() =>
      requestAnimationFrame(() => {
        if (cancelled) return
        ScrollTrigger.refresh()
        scrollToSection(id, { immediate: true })
      }),
    )
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main id="main">
      <Hero />
      <Toggle />
      <Services />
      <Process />
      <Stack />
      <Works />
      <Contact />
    </main>
  )
}
