# DALER — Developer Portfolio

An interactive, single-page portfolio with individual case-study pages for **Daler, Full-Stack Developer**.
The site presents itself as a design file being built live: a typed `HELLO` on a dark canvas, a violet selection
frame with live pixel dimensions, a traced vector silhouette drawn by a pen cursor, and scroll-scrubbed scenes
for developer mode, services, process, stack, selected works and contact.

**Stack:** Vite · React 19 · TypeScript (strict, `erasableSyntaxOnly`) · React Router · GSAP + ScrollTrigger + Flip ·
Lenis · Inter Variable · JetBrains Mono · one hand-written stylesheet. **Tooling:** pnpm, oxlint, sharp, potrace, ffmpeg.

---

## Quick start

```bash
pnpm install        # install dependencies (pnpm only)
pnpm dev            # http://localhost:5173
```

| Command        | What it does                                                          |
| -------------- | --------------------------------------------------------------------- |
| `pnpm dev`     | Vite dev server with HMR                                              |
| `pnpm build`   | Type-check (`tsc -b`) and build to `dist/`                            |
| `pnpm preview` | Serve the production build locally                                    |
| `pnpm lint`    | oxlint + TypeScript check                                             |
| `pnpm trace`   | Re-trace the hero silhouette → `src/data/silhouette.ts`               |
| `pnpm sfx`     | Re-synthesise the UI sounds → `public/audio/*.mp3` (needs ffmpeg)     |
| `pnpm covers`  | Re-render project images → `public/img/works/*.webp`, `public/og.png` |
| `pnpm assets`  | Run `trace`, `sfx` and `covers` in sequence                           |

Requirements: Node 20.19+ (Node 22/24 recommended), pnpm 9+, and ffmpeg with `libmp3lame` for `pnpm sfx`.

> Fast Refresh caveat: editing a section file in dev re-mounts only that section, so pinned ScrollTrigger
> scenes can be measured out of order until you reload the page. Production builds are unaffected.

---

## Folder structure

```
├─ index.html                 meta tags, OG image, favicon
├─ public/
│  ├─ favicon.svg  og.png
│  ├─ audio/                  key, key2, pop, tick, toggle, whoosh, swell (.mp3, generated)
│  ├─ img/works/              project covers + gallery (.webp, 1600 px and 800 px variants)
│  └─ _redirects              Netlify SPA fallback
├─ scripts/
│  ├─ trace.mjs               sharp + potrace → typed silhouette module
│  ├─ make-sfx.sh             ffmpeg synthesis of the sound kit
│  ├─ covers.mjs              SVG → WebP project imagery
│  └─ source/silhouette.svg   source artwork for the silhouette
├─ src/
│  ├─ main.tsx                fonts, CSS, Lenis init (before React renders), router
│  ├─ App.tsx                 routes, HUD, palette, cursor, sound gate, grain
│  ├─ index.css               the only stylesheet (tokens → components → responsive → reduced motion)
│  ├─ data/
│  │  ├─ site.ts              ALL homepage copy, navigation, contact details
│  │  ├─ works.ts             ALL projects (grid, case studies, palette, next-project)
│  │  └─ silhouette.ts        generated — do not edit by hand
│  ├─ lib/
│  │  ├─ scroll.ts            Lenis ↔ GSAP sync, useGsap (gsap.context), scroll helpers
│  │  ├─ motionblur.ts        directional SVG motion blur (tweened or velocity-driven)
│  │  ├─ draw.ts              stroke drawing, path sampling, hand-drawn underline paths
│  │  ├─ sound.ts             opt-in Web Audio sound system + first-visit gate
│  │  └─ bus.ts               typed window events (replay intro, HUD refresh, toast, clipboard)
│  ├─ components/             Chrome (HUD), CommandPalette, CursorTag, SoundGate, Transition, Underline
│  ├─ sections/               Hero, Toggle, Services, Process, Stack, Works, Contact
│  └─ pages/                  Home, Work (case study), NotFound
└─ vercel.json                Vercel SPA rewrites + asset caching
```

### Routes

| Route          | Page                                          |
| -------------- | --------------------------------------------- |
| `/`            | Homepage                                      |
| `/works`       | Redirects to `/#works`                        |
| `/works/:slug` | Case study generated from `src/data/works.ts` |
| `*`            | Custom 404 (“Frame not found”)                |

---

## Editing personal information

Everything lives in **`src/data/site.ts`** — components contain no marketing copy.

- **Identity & meta:** `brand`, `name`, `role`, `meta.title`, `meta.description` (also update `index.html` for crawlers).
- **Hero:** `hero.greeting`, `hero.title`, `hero.role`, `hero.intro`, button labels.
- **Services / process / stack:** `services.items`, `process.steps`, `stack.items`.
- **Contact:** `contact.email` and `contact.socials`. Each social has a `placeholder` flag — values still marked
  `MOCK:` (currently LinkedIn) are placeholders; replace the URL and set `placeholder: false`.

Search the repo for `MOCK` and `TODO` to find everything that still needs real data.

## Adding a project

Append an object to the `works` array in **`src/data/works.ts`** — no component changes are needed. The slug becomes
`/works/<slug>`, and the project automatically appears in the grid, the filters, the command palette and the
“next project” loop.

Rules the data follows (keep them):

- `kind`: `real-product`, `professional`, `personal-project` or `experiment` — shown as a badge.
- `filters`: any of `web`, `backend`, `automation`, `experiments`.
- `results` are technical outcomes or counted facts — never invented users, revenue or performance numbers.
- `verified: false` + `note` shows a “Write-up in progress” banner on the case study until details are confirmed.

## Replacing images

Project images are generated illustrations (`pnpm covers`). To use real screenshots:

1. Export 1600 × 1000 WebP files (plus optional 800 px versions named `*-800.webp`) into `public/img/works/`.
2. Update `src`, `srcSmall`, `alt` and `caption` in `src/data/works.ts`. Keep `width`/`height` accurate so layout
   doesn't shift while lazy images load.
3. Never ship screenshots that expose private data, credentials or internal infrastructure.

## Regenerating the silhouette

```bash
pnpm trace                         # traces scripts/source/silhouette.svg
pnpm trace path/to/portrait.png    # traces your own image
```

The script resizes, flattens, grayscales and thresholds the image with **sharp**, traces it with **potrace**, rounds
the coordinates, crops the viewBox and writes `src/data/silhouette.ts` (path data, anchor count, sampled anchors).
For a photo, remove the background first so the subject is dark on white/transparent; tune `THRESHOLD` in
`scripts/trace.mjs` if detail is lost. Run `pnpm covers` afterwards to refresh images built from the path.

## Generating sound effects

```bash
pnpm sfx
```

`scripts/make-sfx.sh` synthesises seven sounds from ffmpeg filter expressions (no samples, no licences) into
`public/audio/`. Sound is **off by default**; first-time visitors see an “Enable sound?” gate, the choice persists in
`localStorage` (`daler:sound`), and the AudioContext is only created inside a user gesture.

---

## Production build & deployment

```bash
pnpm build      # outputs dist/
pnpm preview    # check it locally
```

`dist/` is a static site. Because routing happens in the browser, the host must serve `index.html` for unknown
paths (otherwise refreshing `/works/riizq` returns the host's 404).

- **Netlify:** `public/_redirects` is copied into `dist/` automatically (`/* /index.html 200`).
- **Vercel:** `vercel.json` rewrites non-asset routes to `/index.html` and caches `/assets/*` immutably.
- **Nginx:**

  ```nginx
  server {
    listen 80;
    server_name example.com;
    root /var/www/daler/dist;
    index index.html;

    location /assets/ {
      expires 1y;
      add_header Cache-Control "public, immutable";
    }
    location / {
      try_files $uri $uri/ /index.html;   # SPA fallback for /works/:slug
    }
  }
  ```

- **Any static host / S3 + CloudFront:** set the error document (403/404) to `/index.html` with a 200 response.

---

## Engineering notes

- **Lenis before React:** `initScroll()` runs in `main.tsx` before `createRoot`, and Lenis drives `ScrollTrigger.update`
  from the GSAP ticker.
- **Clean lifecycles:** every scene is created inside `gsap.context()` via `useGsap()` and reverted on unmount; pinned
  scene callbacks are guarded with `self.isActive`. React StrictMode is intentionally not used (it would double-build
  timelines and double-play intro sounds in development).
- **Refreshing:** ScrollTrigger refreshes after fonts load and whenever images finish loading.
- **Accessibility:** semantic landmarks, skip link, visible focus rings, `role="switch"` toggle, ARIA combobox palette
  with arrow/Enter/Escape, focus-trapped sound dialog, alt text on every image, keyboard skip (`Esc`) for the intro.
- **Reduced motion:** with `prefers-reduced-motion: reduce` the autonomous intro is skipped entirely, pinned scenes become
  static layouts, the marquee stops and CSS transitions collapse.
