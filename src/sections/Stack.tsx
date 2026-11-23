import { site } from '../data/site'

/** Near-black infinite marquee. Pure CSS animation; pauses on hover/focus. */
export function Stack() {
  const { eyebrow, items } = site.stack
  return (
    <section id="stack" className="stack" data-hud="dark" aria-labelledby="stack-title">
      <h2 id="stack-title" className="eyebrow eyebrow--light stack__eyebrow">
        {eyebrow}
      </h2>
      <div className="marquee" tabIndex={0} role="group" aria-label={items.join(', ')}>
        <div className="marquee__track">
          {[0, 1].map((copy) => (
            <ul key={copy} className="marquee__group" aria-hidden="true">
              {items.map((item) => (
                <li key={item}>
                  <span>{item}</span>
                  <i className="marquee__dot" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  )
}
