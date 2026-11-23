/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  PROJECTS — the Works grid, case-study pages, command palette and "next
 *  project" navigation are all generated from this array.
 *
 *  Add a project: append an object to `works` (copy an existing one). The slug
 *  becomes the route /works/<slug>. No component changes are needed.
 *
 *  Honesty rules this file follows:
 *   • `kind` distinguishes real products, personal projects and experiments.
 *   • `verified: false` marks a case study whose details are not yet confirmed
 *     from source — the page then shows a "write-up in progress" note.
 *   • Results are technical outcomes or counted facts — never invented metrics.
 *   • Images are illustrative recreations with sample data unless stated.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type WorkFilter = 'web' | 'backend' | 'automation' | 'experiments'
export type WorkKind = 'real-product' | 'professional' | 'personal-project' | 'experiment'

export interface WorkImage {
  src: string
  /** 800 px variant used for srcset on small screens. */
  srcSmall?: string
  alt: string
  width: number
  height: number
  caption?: string
}

export interface Work {
  slug: string
  number: string
  title: string
  category: string
  filters: WorkFilter[]
  kind: WorkKind
  year: string
  tagline: string
  description: string
  cover: WorkImage
  meta: Array<{ label: string; value: string }>
  overview: string[]
  challenge: string[]
  approach: Array<{ title: string; body: string }>
  stackTitle?: string
  stack: string[]
  results: Array<{ value: string; label: string }>
  resultsNote?: string
  gallery: WorkImage[]
  verified: boolean
  note?: string
}

export const filters: Array<{ id: 'all' | WorkFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'web', label: 'Web Applications' },
  { id: 'backend', label: 'Backend' },
  { id: 'automation', label: 'Automation' },
  { id: 'experiments', label: 'Experiments' },
]

export const kindLabels: Record<WorkKind, string> = {
  'real-product': 'Real product',
  professional: 'Professional work',
  'personal-project': 'Personal project',
  experiment: 'Experiment',
}

const img = (name: string, alt: string, caption?: string): WorkImage => ({
  src: `/img/works/${name}.webp`,
  srcSmall: `/img/works/${name}-800.webp`,
  alt,
  width: 1600,
  height: 1000,
  caption,
})

const ILLUSTRATIVE = 'Illustrative recreation with sample data — not a production screenshot.'

export const works: Work[] = [
  // ── 01 · RIIZQ — facts verified against the project repository (Nov 2026) ──
  {
    slug: 'riizq',
    number: '01',
    title: 'RIIZQ — Mening Fermam',
    category: 'Web Application',
    filters: ['web', 'backend'],
    kind: 'real-product',
    year: '2026',
    tagline: 'A farm management platform for livestock, veterinary care and medicine inventory.',
    description:
      'A farm management platform designed to help farmers manage livestock, veterinary records, medicine inventory, and essential farm operations.',
    cover: img(
      'riizq-dashboard',
      'RIIZQ dashboard: livestock totals, active treatments, today’s doses, feed reserve chart and an animal table',
      ILLUSTRATIVE,
    ),
    meta: [
      { label: 'Role', value: 'Full-stack development (team project)' },
      { label: 'Type', value: 'Real product' },
      { label: 'Platform', value: 'Web app · installable PWA' },
      { label: 'Interface', value: 'Uzbek (Latin)' },
      { label: 'Year', value: '2026' },
    ],
    overview: [
      'RIIZQ — “Mening Fermam” (“My Farm”) — is a full-stack platform for running a livestock farm: farms and animals, veterinary treatments, a medicine pharmacy, feed rations, reports, and a farmer–vet chat with an AI assistant that can escalate to a vet.',
      'It serves several roles from one codebase — farmers, vets, admins and support staff — each with its own workspace and permissions. The frontend is an installable PWA with a guest/offline mode for use around the farm.',
    ],
    challenge: [
      'The domain is deeply relational: animals belong to farms and groups, treatments follow versioned protocols with scheduled doses that need vet approval, and every medicine movement must stay traceable. All of it has to be consistent across roles with very different permissions.',
      'It also had to be production-grade from the start — secure authentication, safe migrations, backups and a repeatable deployment — without exposing that complexity to the people using it on their phones.',
    ],
    approach: [
      {
        title: 'Modular NestJS API',
        body: 'A monorepo with a NestJS backend and a React + TypeScript SPA. The API is split into 24 NestJS modules — domain modules such as animals, vet, pharmacy, inventory, rations, reports and chat, plus infrastructure modules for security, Redis, storage, audit, idempotency and health.',
      },
      {
        title: 'Relational model with Prisma',
        body: 'PostgreSQL 16 modelled with Prisma: 44 models and 38 enums evolved through 24 migrations. Treatment protocols are versioned, and inventory is a movement ledger rather than a mutable counter, so stock history stays auditable.',
      },
      {
        title: 'Authentication & role-based access',
        body: 'Short-lived JWT access tokens with rotating refresh sessions stored server-side, delivered in httpOnly cookies. Five roles (farmer, vet, admin, super admin, support) are enforced by guards, admin roles require TOTP MFA, and a global rate-limit guard protects the API.',
      },
      {
        title: 'Livestock & veterinary workflows',
        body: 'Animal profiles and groups, treatments with dose tasks and vet approvals, a late-dose view for vets, a diseases reference, medicine taxonomy (categories, brands, vial sizes) and a feed calculator — exposed through a documented REST API.',
      },
      {
        title: 'Production deployment',
        body: 'Multi-stage Docker images (pinned base images, non-root runtime) orchestrated with Docker Compose on AWS. Caddy serves the SPA with automatic HTTPS and proxies the API; a one-off job runs Prisma migrations, and scheduled jobs handle backups and health checks.',
      },
      {
        title: 'Quality gates in CI',
        body: 'GitHub Actions runs type-checking, linting, unit tests and end-to-end tests against real PostgreSQL and Redis, a frontend build with a bundle check, dependency and secret scanning, and an image build with a smoke test and vulnerability scan.',
      },
    ],
    stack: ['React', 'TypeScript', 'NestJS', 'PostgreSQL', 'Prisma', 'Redis', 'Docker', 'AWS', 'Caddy', 'PWA'],
    results: [
      { value: '152', label: 'REST route handlers across 25 controllers' },
      { value: '44', label: 'Prisma models · 24 migrations' },
      { value: '5', label: 'roles with guard-based access control' },
      { value: '170+', label: 'backend unit + e2e test files' },
    ],
    resultsNote: 'Counted from the project repository in November 2026. Technical facts, not business metrics.',
    gallery: [
      img('riizq-mobile', 'Two phone screens: the animal list with status chips, and an animal’s treatment protocol with dose steps', ILLUSTRATIVE),
      img('riizq-pharmacy', 'Pharmacy warehouse screen: medicine stock levels with low-stock flags and a stock movement ledger', ILLUSTRATIVE),
      img(
        'riizq-architecture',
        'Architecture diagram: React SPA → Caddy → NestJS API → PostgreSQL, with Redis, S3 and CI',
        'High-level architecture — infrastructure details intentionally omitted.',
      ),
    ],
    verified: true,
  },

  // ── 02 · Mikka — product + stack facts from the Mikka product overview deck ──
  // TODO: confirm your exact role, dates and the parts you built, then set verified: true.
  {
    slug: 'mikka',
    number: '02',
    title: 'Mikka — The Social Map',
    category: 'Social app · Backend',
    filters: ['backend'],
    kind: 'professional',
    year: '2026',
    tagline: 'A social map for foodies and explorers — places, friends, short videos and chat in one app.',
    description:
      'I worked on Mikka, a location-first social app where people discover places, see where their friends are, share geo-tagged short videos and chat.',
    cover: img('mikka-cover', 'Phone showing a city map with friend pins, a search bar and a “together” card', 'Concept illustration — not a product screenshot.'),
    meta: [
      { label: 'Role', value: 'Developer, product team' },
      { label: 'Type', value: 'Professional work' },
      { label: 'Platform', value: 'iOS · Android' },
      { label: 'Year', value: '2026' },
    ],
    overview: [
      'Mikka is a social map for foodies and travellers: one app for finding the best places, seeing where friends are, sharing short videos about favourite spots and talking to each other directly.',
      'I worked at Mikka as part of the team building the product. The app is organised around four areas — Discover (the map of places), Connect (friends on the map), Chat (location-first messaging) and Shorts (15-second geo-tagged videos).',
    ],
    challenge: [
      'Everything in Mikka is tied to a place and a moment: map pins, friends’ last locations, chat messages that carry a location, and videos linked to a venue. The data has to stay fresh and real-time while the codebase stays type-safe and maintainable.',
    ],
    approach: [
      { title: 'Modular NestJS backend', body: 'A TypeScript NestJS API built to be modular and testable.' },
      { title: 'Supabase + PostgreSQL', body: 'Supabase provides Postgres, authentication and real-time capabilities for the product.' },
      { title: 'Prisma ORM', body: 'Type-safe queries and migrations on top of the PostgreSQL database.' },
      { title: 'Cloud deployment', body: 'Containerised with Docker and deployed on AWS (Lightsail).' },
      { title: 'Location-first features', body: 'Map discovery, friends’ live locations, location sharing inside chat, and geo-tagged short videos.' },
      { title: 'Design system', body: 'One visual language with fully designed dark and light themes.' },
    ],
    stack: ['NestJS', 'TypeScript', 'Supabase', 'PostgreSQL', 'Prisma', 'Docker', 'AWS'],
    results: [
      { value: '4', label: 'product areas — Discover, Connect, Chat, Shorts' },
      { value: '2', label: 'platforms — iOS and Android' },
      { value: 'TS', label: 'strict TypeScript across the backend' },
    ],
    gallery: [
      img('mikka-stack', 'Diagram: iOS and Android apps → NestJS API → Supabase and Prisma, deployed on AWS', 'High-level stack, as described in the Mikka product overview.'),
    ],
    verified: false,
    note: 'Product and stack details come from the Mikka product overview. A detailed write-up of my own contributions is in progress.',
  },

  // ── 03 · Axio — no source available when this was written ─────────────────
  // TODO: add verified features, stack, year and screenshots, then set verified: true.
  {
    slug: 'axio',
    number: '03',
    title: 'Axio — CRM & ERP',
    category: 'Business system · CRM / ERP',
    filters: ['web', 'backend'],
    kind: 'real-product',
    year: '2026', // TODO: confirm year
    tagline: 'A CRM and ERP system for running customers and operations from one place.',
    description: 'A CRM/ERP system I designed and built — customer relationships and business operations in a single application.',
    cover: img('axio-cover', 'Axio wordmark next to two connected panels labelled CRM and ERP', 'Concept illustration — not a product screenshot.'),
    meta: [
      { label: 'Role', value: 'Full-stack developer' },
      { label: 'Type', value: 'CRM + ERP system' },
      { label: 'Category', value: 'Business software' },
      { label: 'Status', value: 'Write-up in progress' },
    ],
    overview: [
      'Axio is a CRM and ERP system I built. It brings customer management (CRM) and business operations (ERP) into one application, so a business can work from a single source of truth.',
    ],
    challenge: [
      'CRM and ERP data are tightly connected: customer records and operational records have to stay consistent while different people work with them at the same time.',
    ],
    approach: [
      { title: 'One system, two domains', body: 'Customer management and business operations live in the same application instead of separate tools.' },
      { title: 'Full-stack delivery', body: 'Designed and built end to end — interface, backend and data model.' },
    ],
    stackTitle: 'Focus areas',
    stack: ['CRM', 'ERP', 'Full-stack development', 'Business workflows'],
    results: [{ value: '1', label: 'system covering both CRM and ERP' }],
    gallery: [],
    verified: false,
    note: 'A detailed case study with screenshots and architecture notes is in progress.',
  },

  // ── 04 · Cargo Bot — source not available when this was written ───────────
  // TODO: inspect the Cargo Bot source and replace the scope-level copy below
  //       with verified details (features, stack, year), then set verified: true.
  {
    slug: 'cargo-bot',
    number: '04',
    title: 'Cargo Bot',
    category: 'Automation / Backend',
    filters: ['automation', 'backend'],
    kind: 'personal-project',
    year: '2026', // TODO: confirm year
    tagline: 'An independently built automation project for cargo-related workflows.',
    description: 'A cargo-related automation project developed independently, focused on backend logic, automation workflows and data processing.',
    cover: img('cargo-cover', 'Abstract illustration of parcels connected by a dashed automation path', 'Concept illustration.'),
    meta: [
      { label: 'Role', value: 'Solo developer' },
      { label: 'Type', value: 'Personal project' },
      { label: 'Category', value: 'Automation / Backend' },
      { label: 'Status', value: 'Write-up in progress' },
    ],
    overview: [
      'Cargo Bot is an automation project I developed independently around cargo-related work. It is a backend-first project: the interesting parts live in the logic, not in a visual interface.',
    ],
    challenge: [
      'Turning repetitive, cargo-related tasks into a dependable automated workflow — one that handles its input reliably and stays maintainable as requirements change.',
    ],
    approach: [
      { title: 'Backend architecture', body: 'Structuring the project so that its core logic stays separate from the channels it talks to.' },
      { title: 'Integrations', body: 'Connecting to external APIs where the workflow needs them.' },
      { title: 'Automation workflows', body: 'Encoding the steps of a repetitive process so they run without manual work.' },
      { title: 'Data processing', body: 'Validating and transforming the data that flows through the workflow.' },
    ],
    stackTitle: 'Focus areas',
    stack: ['Backend architecture', 'API integrations', 'Automation', 'Data processing'],
    results: [
      { value: '1', label: 'independently designed and built project' },
      { value: '↻', label: 'repetitive steps moved into an automated workflow' },
    ],
    gallery: [img('cargo-flow', 'Four cards — backend, integrations, automation, data — joined by a dashed path', 'Concept illustration — not a functional diagram.')],
    verified: false,
    note: 'A detailed write-up with architecture notes is in progress — this page currently describes the project’s scope.',
  },

  // ── 05 · Developer Experiments — everything here ships in this very site ──
  {
    slug: 'developer-experiments',
    number: '05',
    title: 'Developer Experiments',
    category: 'Experimental Projects',
    filters: ['experiments'],
    kind: 'experiment',
    year: '2026',
    tagline: 'Prototypes in motion, vector graphics and interface sound — built into this portfolio.',
    description:
      'Selected technical experiments and interactive prototypes: a bitmap-to-vector pipeline, a procedural sound kit and a scroll-driven motion system.',
    cover: img('experiments-vector', 'The traced hero silhouette with Bézier anchors, handles and a violet selection frame', 'Rendered from the real traced path data.'),
    meta: [
      { label: 'Role', value: 'Design + engineering' },
      { label: 'Type', value: 'Personal experiments' },
      { label: 'Where', value: 'Running on this site' },
      { label: 'Year', value: '2026' },
    ],
    overview: [
      'These are experiments, not client work: small, focused prototypes exploring how far a hand-built frontend can go in motion, vector graphics and sound — without UI kits or animation frameworks beyond GSAP.',
      'Every experiment listed here is live in this portfolio, so you can inspect it as you scroll.',
    ],
    challenge: [
      'Making cinematic interactions that still respect the basics: keyboard access, reduced-motion preferences, opt-in sound, fast loads and clean React lifecycles.',
    ],
    approach: [
      {
        title: 'Bitmap → vector pipeline',
        body: 'A Node script uses sharp to threshold a source image and potrace to trace it into Bézier curves, then writes a typed TypeScript module (path data, anchor count, sampled anchors) that the hero animates with a pen-tool cursor.',
      },
      {
        title: 'Procedural sound kit',
        body: 'Seven interface sounds synthesised from ffmpeg filter expressions — no samples. They play through the Web Audio API, stay off by default and only unlock after an explicit user gesture.',
      },
      {
        title: 'Directional motion blur',
        body: 'SVG feGaussianBlur filters driven per-axis by GSAP tweens and scroll velocity, applied only while elements move so the browser isn’t filtering idle text.',
      },
      {
        title: 'Scroll choreography',
        body: 'Lenis smooth scrolling synced to GSAP’s ticker, pinned ScrollTrigger scenes created inside gsap.context() and reverted on unmount, with callbacks guarded by self.isActive.',
      },
      {
        title: 'Keyboard-first navigation',
        body: 'A ⌘K / Ctrl+K command palette with filtering, arrow-key navigation and ARIA combobox semantics that jumps to sections, opens projects and toggles settings.',
      },
    ],
    stack: ['React', 'TypeScript', 'GSAP', 'Lenis', 'SVG', 'Web Audio API', 'Node.js', 'sharp', 'potrace', 'ffmpeg'],
    results: [
      { value: '7', label: 'synthesised UI sounds, opt-in only' },
      { value: '7.5s', label: 'intro timeline, skippable, reduced-motion aware' },
      { value: '0', label: 'UI kits or CSS frameworks' },
      { value: '1', label: 'hand-written stylesheet' },
    ],
    gallery: [
      img('experiments-sound', 'Waveforms of the seven synthesised interface sounds', 'Waveforms decoded from the generated audio files.'),
      img(
        'experiments-motion',
        'Timeline diagram of the hero intro: guides, typing, canvas flip, vector trace, fill and slide-in',
        'The hero intro’s GSAP timeline, stage by stage.',
      ),
    ],
    verified: true,
  },
]

export const getWork = (slug: string | undefined): Work | undefined => works.find((w) => w.slug === slug)

export const nextWork = (slug: string): Work => {
  const i = works.findIndex((w) => w.slug === slug)
  return works[(i + 1) % works.length]
}
