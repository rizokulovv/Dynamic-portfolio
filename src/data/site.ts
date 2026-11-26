/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SITE CONTENT — every piece of copy on the homepage lives here.
 *  Components never hard-code marketing text; edit this file instead.
 *
 *  ⚠ MOCK / PLACEHOLDER VALUES are marked with `MOCK:` comments. Replace them
 *    with your real details before publishing (search this file for "MOCK").
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type SectionId = 'top' | 'developer-mode' | 'services' | 'process' | 'stack' | 'works' | 'contact'

export interface SocialLink {
  id: 'github' | 'linkedin' | 'telegram'
  label: string
  handle: string
  url: string
  /** true while the value is a placeholder that must be replaced. */
  placeholder: boolean
}

export interface Service {
  number: string
  title: string
  /** The word in the title that receives the hand-drawn underline. */
  highlight: string
  summary: string
  tags: string[]
}

export interface ProcessStep {
  number: string
  label: string
  title: string
  body: string
  deliverables: string[]
}

export const site = {
  brand: 'DALER',
  name: 'Daler',
  role: 'Full-Stack Developer',
  year: 2026,
  positioning:
    'I build modern web applications, scalable backend systems, database-driven products, and practical digital solutions.',

  meta: {
    title: 'DALER — Full-Stack Developer',
    description:
      'Daler is a full-stack developer building React + TypeScript interfaces, NestJS backends, PostgreSQL databases and production deployments.',
  },

  /** Top-right HUD navigation. `id` must match a section id. */
  nav: [
    { id: 'works', label: 'Works' },
    { id: 'services', label: 'Services' },
    { id: 'process', label: 'Process' },
    { id: 'contact', label: 'Contact' },
  ] satisfies Array<{ id: SectionId; label: string }>,

  hud: {
    tagline: "PORTFOLIO '26",
    soundOn: 'Sound on',
    soundOff: 'Sound off',
    menu: 'Menu',
  },

  hero: {
    greeting: 'HELLO',
    cursorName: 'Daler',
    pretitle: "I'M",
    title: 'DALER',
    role: 'FULL-STACK DEVELOPER',
    intro:
      'I build digital products from frontend interfaces to backend architecture, turning ideas into functional and scalable applications.',
    primary: { label: 'Explore my work', target: 'works' as SectionId },
    secondary: { label: "Let's talk", target: 'contact' as SectionId },
    skip: 'Skip intro',
    frameLabel: 'Frame 01 — Hero',
    layerLabel: 'daler.svg',
    figureAlt: 'Vector silhouette of a developer in profile, wearing a hoodie with headphones around the neck',
    scrollHint: 'Scroll',
  },

  soundGate: {
    title: 'Enable sound?',
    body: 'Subtle interface sounds — keys, pops and whooshes, synthesised locally. Off by default; you can change it anytime from the bottom-right corner.',
    enable: 'Enable sound',
    mute: 'Continue muted',
  },

  toggle: {
    eyebrow: 'Toggle / Developer mode',
    title: 'Developer mode',
    off: 'Just functional.',
    on: 'Functional + beautiful.',
    caption: 'Scroll or flip the switch',
    switchLabel: 'Developer mode',
    specimen: {
      label: 'Component / Treatment card',
      title: 'Treatment plan',
      meta: '4 doses · approved',
      action: 'Mark dose',
      code: ['border-radius: 24px;', 'box-shadow: var(--lift);', 'font: 650 15px Inter;', 'transition: 400ms ease;'],
    },
  },

  services: {
    eyebrow: 'Services',
    title: 'What I build',
    items: [
      {
        number: '01',
        title: 'Frontend Development',
        highlight: 'Frontend',
        summary: 'React, TypeScript, responsive interfaces.',
        tags: ['React', 'TypeScript', 'Responsive UI', 'Accessibility'],
      },
      {
        number: '02',
        title: 'Backend Development',
        highlight: 'Backend',
        summary: 'NestJS, Node.js, REST APIs, server architecture.',
        tags: ['NestJS', 'Node.js', 'REST APIs', 'Auth & roles'],
      },
      {
        number: '03',
        title: 'Database Architecture',
        highlight: 'Database',
        summary: 'PostgreSQL, Prisma ORM, relational database design.',
        tags: ['PostgreSQL', 'Prisma ORM', 'Migrations', 'Data modelling'],
      },
      {
        number: '04',
        title: 'Full-Stack Applications',
        highlight: 'Full-Stack',
        summary: 'Complete applications from frontend to backend.',
        tags: ['End-to-end', 'Authentication', 'Authorization', 'APIs + UI'],
      },
      {
        number: '05',
        title: 'Deployment & Infrastructure',
        highlight: 'Deployment',
        summary: 'AWS, Linux, Docker, Nginx, production deployment.',
        tags: ['AWS', 'Linux', 'Docker', 'Nginx'],
      },
    ] satisfies Service[],
  },

  process: {
    eyebrow: 'Process',
    title: 'How I build software',
    steps: [
      {
        number: '01',
        label: 'PLAN',
        title: 'Plan',
        body: 'Understand requirements, define architecture, identify constraints.',
        deliverables: ['Requirements', 'Architecture', 'Constraints'],
      },
      {
        number: '02',
        label: 'DESIGN',
        title: 'Design',
        body: 'Structure interfaces, define user flows, create a clear visual system.',
        deliverables: ['User flows', 'Interface structure', 'Visual system'],
      },
      {
        number: '03',
        label: 'BUILD',
        title: 'Build',
        body: 'Implement frontend, backend, database, APIs, and application logic.',
        deliverables: ['Frontend', 'Backend + APIs', 'Database'],
      },
      {
        number: '04',
        label: 'SHIP',
        title: 'Ship',
        body: 'Test, optimize, deploy, and verify production behavior.',
        deliverables: ['Testing', 'Optimisation', 'Deployment'],
      },
    ] satisfies ProcessStep[],
  },

  stack: {
    eyebrow: 'Technology stack',
    items: [
      'React',
      'TypeScript',
      'JavaScript',
      'Node.js',
      'NestJS',
      'PostgreSQL',
      'Prisma',
      'Redis',
      'AWS',
      'Docker',
      'Nginx',
      'Git',
      'Linux',
    ],
  },

  works: {
    eyebrow: 'Works',
    title: 'Selected Works',
    intro: 'Real products, personal projects and clearly-labelled experiments.',
    cursor: 'View',
    empty: 'Nothing in this category yet.',
  },

  contact: {
    eyebrow: 'Contact',
    title: "LET'S BUILD SOMETHING.",
    animated: { lead: "Let's build something", words: ['users love.', 'that scales.', 'that ships.'] },
    role: 'Full-Stack Developer',
    // Live clock in the contact grid. Change `timeZone` (IANA name) + `zone` if you move.
    localTime: { label: 'Local time', timeZone: 'Asia/Tashkent', zone: 'GMT+5' },
    availability: 'Available for projects',
    email: 'rizoqulov.daler1@gmail.com',
    socials: [
      { id: 'github', label: 'GitHub', handle: '@rizokulovv', url: 'https://github.com/rizokulovv', placeholder: false },
      // MOCK: LinkedIn not supplied yet — replace the handle + URL, then set placeholder: false.
      { id: 'linkedin', label: 'LinkedIn', handle: 'in/your-linkedin', url: 'https://www.linkedin.com/in/your-linkedin', placeholder: true },
      { id: 'telegram', label: 'Telegram', handle: '@rizokulovvv', url: 'https://t.me/rizokulovvv', placeholder: false },
    ] satisfies SocialLink[],
    actions: { email: 'Send an email', copy: 'Copy email', copied: 'Email copied', top: 'Back to top' },
    footer: 'Designed & built by Daler — React, TypeScript, GSAP, Lenis.',
  },

  workPage: {
    back: 'Back to works',
    overview: 'Overview',
    challenge: 'Challenge',
    approach: 'Technical approach',
    stack: 'Technology stack',
    results: 'Results',
    gallery: 'Gallery',
    next: 'Next project',
    pending: 'Write-up in progress',
  },

  notFound: {
    code: '404',
    title: 'Frame not found',
    body: 'This layer doesn’t exist — it may have been renamed, moved or never shipped.',
    action: 'Back to the canvas',
  },

  palette: {
    placeholder: 'Type a command or search…',
    empty: 'No matching commands',
    hint: 'to navigate',
    groups: { navigate: 'Navigate', projects: 'Projects', actions: 'Actions', links: 'Links' },
    actions: {
      soundOn: 'Turn sound on',
      soundOff: 'Turn sound off',
      copyEmail: 'Copy email',
      replay: 'Replay introduction',
    },
    sections: {
      top: 'Home',
      'developer-mode': 'Developer mode',
      services: 'Services',
      process: 'Process',
      stack: 'Technology stack',
      works: 'Selected works',
      contact: 'Contact',
    } satisfies Record<SectionId, string>,
  },
}

export type Site = typeof site
