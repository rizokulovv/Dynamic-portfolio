#!/usr/bin/env node
/**
 * Project imagery generator.
 *
 * Every cover and gallery image in public/img/works is drawn here as SVG and
 * rasterised with sharp → WebP (1600 px + 800 px variants). The RIIZQ screens are
 * illustrative recreations with SAMPLE DATA — no production data, hostnames or
 * credentials are involved. The experiment images are built from real repo data
 * (the traced silhouette path and the synthesised sound files).
 *
 *   pnpm covers
 *
 * To use real screenshots instead, drop WebP files into public/img/works and
 * update the `src` fields in src/data/works.ts.
 */
import { spawnSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// librsvg resolves fonts through fontconfig. Point it at the fontsource files so the
// images render with Inter + JetBrains Mono on any machine, then re-exec once.
if (!process.env.DALER_FONTS) {
  const conf = path.join(tmpdir(), 'daler-fonts.conf')
  await writeFile(
    conf,
    `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig>
<dir>${root}/node_modules/@fontsource-variable/inter/files</dir>
<dir>${root}/node_modules/@fontsource/jetbrains-mono/files</dir>
<include ignore_missing="yes">/etc/fonts/fonts.conf</include>
<cachedir>${path.join(tmpdir(), 'daler-fc-cache')}</cachedir>
</fontconfig>`,
  )
  const res = spawnSync(process.execPath, process.argv.slice(1), {
    stdio: 'inherit',
    env: { ...process.env, FONTCONFIG_FILE: conf, DALER_FONTS: '1' },
  })
  process.exit(res.status ?? 1)
}

const { default: sharp } = await import('sharp')

const OUT = path.join(root, 'public/img/works')
await mkdir(OUT, { recursive: true })

// ── Tokens + primitives ──────────────────────────────────────────────────────
const C = {
  ink: '#0b0b0f',
  ink2: '#3a3a44',
  muted: '#7b7b86',
  paper: '#fafafc',
  night: '#07070b',
  bg: '#f1f1f4',
  violet: '#6b4eff',
  violet2: '#8a73ff',
  line: '#e6e6ec',
  tint: '#f1eeff',
}
const SANS = `Inter, 'Adwaita Sans', 'Noto Sans', Arial, sans-serif`
const MONO = `'JetBrains Mono', 'Noto Sans Mono', monospace`
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const text = (x, y, str, o = {}) => {
  const { size = 14, weight = 500, fill = C.ink, mono = false, anchor = 'start', ls = 0, opacity = 1 } = o
  return `<text x="${x}" y="${y}" font-family="${mono ? MONO : SANS}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" letter-spacing="${ls}" opacity="${opacity}">${esc(str)}</text>`
}
const rect = (x, y, w, h, o = {}) => {
  const { rx = 0, fill = 'none', stroke = 'none', sw = 1, dash = '', opacity = 1, filter = '' } = o
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''} opacity="${opacity}"${filter ? ` filter="url(#${filter})"` : ''}/>`
}
const circle = (cx, cy, r, o = {}) => {
  const { fill = 'none', stroke = 'none', sw = 1, opacity = 1 } = o
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${opacity}"/>`
}
const line = (x1, y1, x2, y2, o = {}) => {
  const { stroke = C.line, sw = 1, dash = '', opacity = 1 } = o
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''} opacity="${opacity}"/>`
}
const chip = (x, y, label, tone = 'muted', o = {}) => {
  const size = o.size ?? 12
  const w = Math.round(label.length * size * 0.6 + 22)
  const tones = {
    violet: [C.tint, C.violet, 'none'],
    solid: [C.violet, '#fff', 'none'],
    muted: ['#f0f0f3', C.ink2, 'none'],
    ink: [C.ink, '#fff', 'none'],
    outline: ['none', C.ink2, '#d4d4dc'],
    dark: ['rgba(255,255,255,.08)', 'rgba(255,255,255,.78)', 'none'],
  }
  const [bg, fg, st] = tones[tone]
  return {
    w,
    svg:
      rect(x, y, w, size + 12, { rx: (size + 12) / 2, fill: bg, stroke: st }) +
      text(x + w / 2, y + size + 2.5, label, { size, weight: 600, fill: fg, anchor: 'middle' }),
  }
}

const defs = `<defs>
  <linearGradient id="bgLight" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#f3f0ff"/><stop offset=".55" stop-color="${C.bg}"/><stop offset="1" stop-color="#ecebf2"/>
  </linearGradient>
  <radialGradient id="glow" cx=".72" cy=".28" r=".7">
    <stop offset="0" stop-color="${C.violet}" stop-opacity=".55"/><stop offset=".55" stop-color="${C.violet}" stop-opacity=".08"/><stop offset="1" stop-color="${C.night}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.violet}" stop-opacity=".28"/><stop offset="1" stop-color="${C.violet}" stop-opacity="0"/>
  </linearGradient>
  <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.2" fill="${C.ink}" opacity=".09"/></pattern>
  <pattern id="dotsDark" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.2" fill="#fff" opacity=".08"/></pattern>
  <filter id="shadow" x="-10%" y="-10%" width="120%" height="135%">
    <feGaussianBlur in="SourceAlpha" stdDeviation="26"/><feOffset dy="28"/>
    <feComponentTransfer><feFuncA type="linear" slope=".16"/></feComponentTransfer>
    <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="soft" x="-10%" y="-10%" width="120%" height="140%">
    <feGaussianBlur in="SourceAlpha" stdDeviation="8"/><feOffset dy="6"/>
    <feComponentTransfer><feFuncA type="linear" slope=".08"/></feComponentTransfer>
    <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="shadowDark" x="-20%" y="-10%" width="140%" height="130%">
    <feGaussianBlur in="SourceAlpha" stdDeviation="30"/><feOffset dy="30"/>
    <feComponentTransfer><feFuncA type="linear" slope=".7"/></feComponentTransfer>
    <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>`

const svgDoc = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs}${body}</svg>`

const smoothPath = (pts) => {
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const mx = (x0 + x1) / 2
    d += ` C ${mx} ${y0} ${mx} ${y1} ${x1} ${y1}`
  }
  return d
}

// ── RIIZQ: shared desktop window with sidebar ────────────────────────────────
const NAV = ['Bosh sahifa', 'Fermalar', 'Hayvonlar', 'Davolash', 'Dorixona', 'Ozuqa', 'Hisobotlar', 'Chat', 'AI yordamchi']

function appWindow(active, title, main) {
  const x0 = 110
  const y0 = 90
  const ww = 1380
  const wh = 820
  const side = 240
  let s = rect(0, 0, 1600, 1000, { fill: 'url(#bgLight)' }) + rect(0, 0, 1600, 1000, { fill: 'url(#dots)' })
  s += rect(x0, y0, ww, wh, { rx: 22, fill: C.paper, filter: 'shadow' })
  s += `<clipPath id="win"><rect x="${x0}" y="${y0}" width="${ww}" height="${wh}" rx="22"/></clipPath><g clip-path="url(#win)">`
  // title bar
  s += rect(x0, y0, ww, 48, { fill: '#f4f4f7' }) + line(x0, y0 + 48, x0 + ww, y0 + 48)
  ;['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => (s += circle(x0 + 26 + i * 20, y0 + 24, 6, { fill: c, opacity: 0.85 })))
  s += rect(x0 + ww / 2 - 170, y0 + 11, 340, 26, { rx: 13, fill: '#fff', stroke: C.line })
  s += text(x0 + ww / 2, y0 + 29, `Mening Fermam · ${title}`, { size: 12.5, fill: C.muted, anchor: 'middle', mono: true })
  // sidebar
  s += rect(x0, y0 + 48, side, wh - 48, { fill: '#f6f5fb' }) + line(x0 + side, y0 + 48, x0 + side, y0 + wh)
  s += rect(x0 + 24, y0 + 76, 36, 36, { rx: 10, fill: C.violet })
  s += text(x0 + 42, y0 + 100, 'R', { size: 18, weight: 800, fill: '#fff', anchor: 'middle' })
  s += text(x0 + 72, y0 + 92, 'RIIZQ', { size: 17, weight: 800, ls: -0.4 })
  s += text(x0 + 72, y0 + 109, 'Mening Fermam', { size: 11.5, fill: C.muted })
  NAV.forEach((label, i) => {
    const y = y0 + 148 + i * 44
    const on = label === active
    if (on) s += rect(x0 + 14, y - 22, side - 28, 38, { rx: 10, fill: C.violet })
    s += rect(x0 + 30, y - 10, 15, 15, { rx: 4, stroke: on ? '#fff' : C.muted, sw: 1.6 })
    s += text(x0 + 58, y + 2, label, { size: 14, weight: on ? 650 : 500, fill: on ? '#fff' : C.ink2 })
  })
  s += rect(x0 + 16, y0 + wh - 82, side - 32, 60, { rx: 14, fill: '#fff', stroke: C.line })
  s += circle(x0 + 46, y0 + wh - 52, 16, { fill: C.tint })
  s += text(x0 + 46, y0 + wh - 47, 'F', { size: 13, weight: 700, fill: C.violet, anchor: 'middle' })
  s += text(x0 + 72, y0 + wh - 56, 'Fermer', { size: 13, weight: 650 })
  s += text(x0 + 72, y0 + wh - 39, 'FARMER', { size: 10.5, fill: C.muted, mono: true, ls: 0.6 })
  s += main({ x: x0 + side + 32, y: y0 + 48, w: ww - side - 64, h: wh - 48 })
  s += '</g>'
  return s
}

function riizqDashboard() {
  return appWindow('Bosh sahifa', 'Bosh sahifa', ({ x, y, w }) => {
    let s = ''
    s += text(x, y + 52, 'Bosh sahifa', { size: 30, weight: 800, ls: -1 })
    s += text(x, y + 78, 'Bugungi holat · 23 noyabr', { size: 14, fill: C.muted })
    s += rect(x + w - 196, y + 26, 196, 42, { rx: 21, fill: C.violet })
    s += text(x + w - 98, y + 52, '+ Hayvon qo’shish', { size: 14, weight: 650, fill: '#fff', anchor: 'middle' })
    s += rect(x + w - 330, y + 26, 120, 42, { rx: 21, fill: '#fff', stroke: C.line })
    s += text(x + w - 270, y + 52, 'Hisobot', { size: 14, weight: 600, fill: C.ink2, anchor: 'middle' })
    // KPI cards
    const kpis = [
      ['Jami hayvonlar', '248', '+12 bu oy', 'violet'],
      ['Faol davolash', '7', '3 ta protokol', 'muted'],
      ['Bugungi dozalar', '18/24', '75% bajarildi', 'muted'],
      ['Kam qolgan dorilar', '3', 'Buyurtma kerak', 'ink'],
    ]
    const kw = (w - 48) / 4
    kpis.forEach(([label, value, sub, tone], i) => {
      const kx = x + i * (kw + 16)
      const ky = y + 110
      s += rect(kx, ky, kw, 122, { rx: 16, fill: '#fff', stroke: C.line, filter: 'soft' })
      s += text(kx + 20, ky + 32, label, { size: 13, fill: C.muted, weight: 550 })
      s += text(kx + 20, ky + 80, value, { size: 38, weight: 800, ls: -1.5 })
      s += chip(kx + 20, ky + 92, sub, tone, { size: 11 }).svg
      if (i === 2) {
        s += rect(kx + kw - 96, ky + 64, 76, 6, { rx: 3, fill: '#ececf1' })
        s += rect(kx + kw - 96, ky + 64, 57, 6, { rx: 3, fill: C.violet })
      }
    })
    // Chart card
    const cy = y + 248
    const cw = w - 368
    s += rect(x, cy, cw, 256, { rx: 16, fill: '#fff', stroke: C.line, filter: 'soft' })
    s += text(x + 22, cy + 34, 'Ozuqa zaxirasi', { size: 16, weight: 700 })
    s += text(x + 22, cy + 54, 'kunlarda · so’nggi 12 hafta', { size: 12.5, fill: C.muted })
    s += chip(x + cw - 128, cy + 20, 'Barcha fermalar', 'muted', { size: 11 }).svg
    const data = [38, 41, 39, 44, 42, 40, 46, 43, 47, 45, 49, 52]
    const gx = x + 56
    const gw = cw - 84
    const gy = cy + 78
    const gh = 140
    ;[0, 1, 2, 3].forEach((g) => {
      const yy = gy + (gh / 3) * g
      s += line(gx, yy, gx + gw, yy, { stroke: '#efeff3' })
      s += text(gx - 12, yy + 4, String(60 - g * 10), { size: 11, fill: C.muted, anchor: 'end', mono: true })
    })
    const pts = data.map((v, i) => [gx + (gw / (data.length - 1)) * i, gy + gh - ((v - 30) / 30) * gh])
    const d = smoothPath(pts)
    s += `<path d="${d} L ${gx + gw} ${gy + gh} L ${gx} ${gy + gh} Z" fill="url(#area)"/>`
    s += `<path d="${d}" fill="none" stroke="${C.violet}" stroke-width="3" stroke-linecap="round"/>`
    pts.forEach(([px], i) => {
      if (i % 2 === 1) s += text(px, gy + gh + 22, `H${i + 1}`, { size: 10.5, fill: C.muted, anchor: 'middle', mono: true })
    })
    const [lx, ly] = pts[pts.length - 1]
    s += circle(lx, ly, 7, { fill: '#fff', stroke: C.violet, sw: 3 })
    s += rect(lx - 74, ly - 46, 66, 28, { rx: 8, fill: C.ink })
    s += text(lx - 41, ly - 27, '52 kun', { size: 12, weight: 650, fill: '#fff', anchor: 'middle' })
    // Doses card
    const dx = x + cw + 16
    const dw = 352
    s += rect(dx, cy, dw, 256, { rx: 16, fill: '#fff', stroke: C.line, filter: 'soft' })
    s += text(dx + 22, cy + 34, 'Bugungi dozalar', { size: 16, weight: 700 })
    s += text(dx + dw - 22, cy + 34, '24', { size: 13, fill: C.muted, anchor: 'end', mono: true })
    const doses = [
      ['08:00', 'UZ-0142 · Ivermektin 1%', 'Berildi', 'violet'],
      ['10:30', 'UZ-0087 · Vitamin AD3E', 'Berildi', 'violet'],
      ['13:00', 'UZ-0203 · Oksitetratsiklin', 'Kutilmoqda', 'outline'],
      ['16:00', 'UZ-0019 · Penstrep', 'Kechikkan', 'ink'],
    ]
    doses.forEach(([time, label, status, tone], i) => {
      const ry = cy + 66 + i * 46
      s += text(dx + 22, ry + 20, time, { size: 12, fill: C.muted, mono: true })
      s += text(dx + 76, ry + 20, label, { size: 13, weight: 550, fill: C.ink2 })
      const c = chip(0, 0, status, tone, { size: 10.5 })
      s += chip(dx + dw - 22 - c.w, ry + 4, status, tone, { size: 10.5 }).svg
      if (i < doses.length - 1) s += line(dx + 22, ry + 38, dx + dw - 22, ry + 38, { stroke: '#f0f0f4' })
    })
    // Table
    const ty = cy + 272
    s += rect(x, ty, w, 226, { rx: 16, fill: '#fff', stroke: C.line, filter: 'soft' })
    s += text(x + 22, ty + 34, 'Hayvonlar', { size: 16, weight: 700 })
    s += rect(x + w - 262, ty + 14, 240, 32, { rx: 16, fill: '#f4f4f7' })
    s += text(x + w - 242, ty + 35, 'Teg yoki guruh bo’yicha qidirish…', { size: 12, fill: C.muted })
    const cols = [
      ['Teg', 0],
      ['Turi', 150],
      ['Guruh', 300],
      ['Holat', 520],
      ['Oxirgi ko’rik', 720],
      ['Mas’ul vet', 880],
    ]
    cols.forEach(([c, off]) => (s += text(x + 22 + off, ty + 74, c.toUpperCase(), { size: 10.5, fill: C.muted, mono: true, ls: 0.8 })))
    const rows = [
      ['UZ-0142', 'Sigir', 'Sog’in podasi', ['Davolanmoqda', 'violet'], '21.11.2026', 'Vet · A.'],
      ['UZ-0087', 'Buzoq', 'Yosh mollar', ['Sog’lom', 'muted'], '19.11.2026', 'Vet · S.'],
      ['UZ-0203', 'Qo’y', 'Qo’ra A', ['Kuzatuvda', 'outline'], '22.11.2026', 'Vet · A.'],
    ]
    rows.forEach((r, i) => {
      const ry = ty + 86 + i * 44
      s += line(x + 22, ry, x + w - 22, ry, { stroke: '#f0f0f4' })
      s += text(x + 22, ry + 28, r[0], { size: 13, weight: 650, mono: true })
      s += text(x + 172, ry + 28, r[1], { size: 13.5, fill: C.ink2 })
      s += text(x + 322, ry + 28, r[2], { size: 13.5, fill: C.ink2 })
      s += chip(x + 542, ry + 11, r[3][0], r[3][1], { size: 11 }).svg
      s += text(x + 742, ry + 28, r[4], { size: 12.5, fill: C.muted, mono: true })
      s += text(x + 902, ry + 28, r[5], { size: 13.5, fill: C.ink2 })
    })
    return s
  })
}

function riizqPharmacy() {
  return appWindow('Dorixona', 'Dorixona ombori', ({ x, y, w }) => {
    let s = ''
    s += text(x, y + 52, 'Dorixona ombori', { size: 30, weight: 800, ls: -1 })
    s += text(x, y + 78, 'Dorilar, hajmlar va zaxira harakatlari', { size: 14, fill: C.muted })
    s += rect(x + w - 176, y + 26, 176, 42, { rx: 21, fill: C.violet })
    s += text(x + w - 88, y + 52, '+ Kirim qilish', { size: 14, weight: 650, fill: '#fff', anchor: 'middle' })
    // tabs
    ;['Dorilar', 'Harakatlar', 'Turkumlar', 'Brendlar'].forEach((tab, i) => {
      const tx = x + i * 118
      s += text(tx, y + 128, tab, { size: 14.5, weight: i === 0 ? 700 : 500, fill: i === 0 ? C.ink : C.muted })
      if (i === 0) s += rect(tx, y + 140, 58, 3, { rx: 1.5, fill: C.violet })
    })
    s += line(x, y + 143, x + w, y + 143)
    // medicines table
    const tw = w - 336
    const ty = y + 168
    s += rect(x, ty, tw, 560, { rx: 16, fill: '#fff', stroke: C.line, filter: 'soft' })
    const cols = [
      ['Nomi', 0],
      ['Turkum', 210],
      ['Hajm', 360],
      ['Qoldiq', 440],
    ]
    cols.forEach(([c, off]) => (s += text(x + 22 + off, ty + 38, c.toUpperCase(), { size: 10.5, fill: C.muted, mono: true, ls: 0.8 })))
    const meds = [
      ['Ivermektin 1%', 'Antiparazitar', '50 ml', 0.72, 'violet'],
      ['Oksitetratsiklin LA', 'Antibiotik', '100 ml', 0.18, 'ink'],
      ['Vitamin AD3E', 'Vitamin', '100 ml', 0.54, 'violet'],
      ['Penstrep 400', 'Antibiotik', '100 ml', 0.12, 'ink'],
      ['Albendazol 10%', 'Antiparazitar', '1 l', 0.86, 'violet'],
      ['Kalsiy borglyukonat', 'Mineral', '450 ml', 0.41, 'violet'],
      ['Meloksikam 2%', 'NSAID', '50 ml', 0.09, 'ink'],
      ['Tetravit', 'Vitamin', '100 ml', 0.63, 'violet'],
    ]
    meds.forEach(([name, cat, vol, level, tone], i) => {
      const ry = ty + 56 + i * 62
      s += line(x + 22, ry, x + tw - 22, ry, { stroke: '#f0f0f4' })
      s += rect(x + 22, ry + 15, 32, 32, { rx: 9, fill: tone === 'ink' ? '#f0f0f3' : C.tint })
      s += rect(x + 33, ry + 22, 10, 18, { rx: 3, stroke: tone === 'ink' ? C.ink2 : C.violet, sw: 1.6 })
      s += text(x + 66, ry + 36, name, { size: 14, weight: 650 })
      s += text(x + 232, ry + 36, cat, { size: 13, fill: C.ink2 })
      s += text(x + 382, ry + 36, vol, { size: 12.5, fill: C.muted, mono: true })
      const bx = x + 462
      const bw = tw - 462 - 22 - 80 - 56
      s += rect(bx, ry + 27, bw, 8, { rx: 4, fill: '#ececf1' })
      s += rect(bx, ry + 27, Math.max(8, bw * level), 8, { rx: 4, fill: tone === 'ink' ? C.ink : C.violet })
      s += text(bx + bw + 16, ry + 36, `${Math.round(level * 40)} fl`, { size: 12.5, fill: C.ink2, mono: true })
      if (tone === 'ink') s += chip(x + tw - 92, ry + 18, 'Kam', 'ink', { size: 10.5 }).svg
    })
    // ledger
    const lx = x + tw + 16
    const lw = 320
    s += rect(lx, ty, lw, 560, { rx: 16, fill: C.ink })
    s += text(lx + 22, ty + 36, 'Harakatlar jurnali', { size: 16, weight: 700, fill: '#fff' })
    s += text(lx + 22, ty + 56, 'Har bir kirim va chiqim yozib boriladi', { size: 12, fill: 'rgba(255,255,255,.5)' })
    const moves = [
      ['+20', 'Kirim', 'Ivermektin 1% · 50 ml', '22.11 · 09:14'],
      ['−2', 'Chiqim', 'UZ-0142 · davolash', '22.11 · 08:02'],
      ['−1', 'Chiqim', 'UZ-0203 · davolash', '21.11 · 17:40'],
      ['+12', 'Kirim', 'Vitamin AD3E · 100 ml', '21.11 · 11:05'],
      ['−3', 'Chiqim', 'Qo’ra A · profilaktika', '20.11 · 15:22'],
      ['+6', 'Kirim', 'Penstrep 400 · 100 ml', '19.11 · 10:48'],
    ]
    moves.forEach(([qty, kind, label, when], i) => {
      const ry = ty + 82 + i * 76
      const inbound = qty.startsWith('+')
      s += rect(lx + 18, ry, lw - 36, 64, { rx: 12, fill: 'rgba(255,255,255,.05)', stroke: 'rgba(255,255,255,.07)' })
      s += text(lx + 36, ry + 40, qty, { size: 20, weight: 800, fill: inbound ? C.violet2 : '#fff', mono: true })
      s += text(lx + 100, ry + 28, label, { size: 13.5, weight: 600, fill: '#fff' })
      s += text(lx + 100, ry + 47, `${kind} · ${when}`, { size: 11.5, fill: 'rgba(255,255,255,.5)', mono: true })
    })
    return s
  })
}

// ── RIIZQ: mobile PWA screens ────────────────────────────────────────────────
function phone(x, y, title, body) {
  const w = 360
  const h = 740
  let s = rect(x - 10, y - 10, w + 20, h + 20, { rx: 56, fill: '#16161c', filter: 'shadowDark' })
  s += rect(x, y, w, h, { rx: 46, fill: C.paper })
  s += `<clipPath id="ph${x}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="46"/></clipPath><g clip-path="url(#ph${x})">`
  s += rect(x + w / 2 - 56, y + 12, 112, 30, { rx: 15, fill: '#0b0b0f' })
  s += text(x + 30, y + 34, '9:41', { size: 14, weight: 650 })
  s += text(x + 28, y + 92, title, { size: 26, weight: 800, ls: -0.8 })
  s += body({ x: x + 22, y: y + 110, w: w - 44 })
  // tab bar
  s += rect(x, y + h - 84, w, 84, { fill: '#fff' }) + line(x, y + h - 84, x + w, y + h - 84)
  ;[0, 1, 2, 3, 4].forEach((i) => {
    const cx = x + 40 + i * 70
    s += rect(cx - 10, y + h - 60, 20, 20, { rx: 6, stroke: i === 1 ? C.violet : C.muted, sw: 1.8, fill: i === 1 ? C.tint : 'none' })
  })
  s += rect(x + w / 2 - 60, y + h - 14, 120, 5, { rx: 2.5, fill: C.ink })
  s += '</g>'
  return s
}

function riizqMobile() {
  let s = rect(0, 0, 1600, 1000, { fill: C.night }) + rect(0, 0, 1600, 1000, { fill: 'url(#glow)' }) + rect(0, 0, 1600, 1000, { fill: 'url(#dotsDark)' })
  s += text(110, 150, 'RIIZQ / MOBILE PWA', { size: 15, fill: C.violet2, mono: true, ls: 2 })
  s += text(106, 230, 'Livestock &amp;'.replace('&amp;', '&'), { size: 64, weight: 800, fill: '#fff', ls: -3 })
  s += text(106, 300, 'treatment flows', { size: 64, weight: 800, fill: '#fff', ls: -3 })
  s += text(110, 352, 'Illustrative recreation · sample data', { size: 15, fill: 'rgba(255,255,255,.45)', mono: true })
  ;['FARMER', 'VET', 'ADMIN'].forEach((r, i) => (s += chip(110 + i * 104, 392, r, 'dark', { size: 12 }).svg))

  s += phone(690, 150, 'Hayvonlar', ({ x, y, w }) => {
    let b = rect(x, y, w, 42, { rx: 21, fill: '#f0f0f4' })
    b += text(x + 18, y + 27, 'Teg bo’yicha qidirish…', { size: 13.5, fill: C.muted })
    let cx = x
    ;['Barchasi', 'Sigir', 'Qo’y', 'Buzoq'].forEach((f, i) => {
      const c = chip(cx, y + 58, f, i === 0 ? 'solid' : 'muted', { size: 12 })
      b += c.svg
      cx += c.w + 8
    })
    const animals = [
      ['S', 'UZ-0142', 'Sigir · Sog’in podasi', ['Davolanmoqda', 'violet']],
      ['B', 'UZ-0087', 'Buzoq · Yosh mollar', ['Sog’lom', 'muted']],
      ['Q', 'UZ-0203', 'Qo’y · Qo’ra A', ['Kuzatuvda', 'outline']],
      ['S', 'UZ-0019', 'Sigir · Sog’in podasi', ['Sog’lom', 'muted']],
      ['Q', 'UZ-0211', 'Qo’y · Qo’ra B', ['Sog’lom', 'muted']],
    ]
    animals.forEach(([init, tag, sub, [st, tone]], i) => {
      const ry = y + 110 + i * 92
      b += rect(x, ry, w, 80, { rx: 18, fill: '#fff', stroke: C.line })
      b += circle(x + 38, ry + 40, 22, { fill: i === 0 ? C.violet : C.tint })
      b += text(x + 38, ry + 46, init, { size: 16, weight: 750, fill: i === 0 ? '#fff' : C.violet, anchor: 'middle' })
      b += text(x + 74, ry + 36, tag, { size: 15, weight: 700, mono: true })
      b += text(x + 74, ry + 57, sub, { size: 12.5, fill: C.muted })
      const c = chip(0, 0, st, tone, { size: 10.5 })
      b += chip(x + w - 14 - c.w, ry + 15, st, tone, { size: 10.5 }).svg
    })
    return b
  })

  s += phone(1110, 210, 'UZ-0142', ({ x, y, w }) => {
    let b = ''
    let cx = x
    ;['Sigir', '4 yosh', '512 kg'].forEach((f) => {
      const c = chip(cx, y - 4, f, 'muted', { size: 12 })
      b += c.svg
      cx += c.w + 8
    })
    b += rect(x, y + 40, w, 132, { rx: 20, fill: C.ink })
    b += text(x + 20, y + 72, 'DAVOLASH PROTOKOLI', { size: 11, fill: C.violet2, mono: true, ls: 1.2 })
    b += text(x + 20, y + 104, 'Mastit · v3', { size: 22, weight: 800, fill: '#fff', ls: -0.6 })
    b += chip(x + 20, y + 124, 'Vet tasdiqlagan', 'solid', { size: 11 }).svg
    b += text(x + w - 20, y + 104, '4 doza', { size: 13, fill: 'rgba(255,255,255,.6)', anchor: 'end', mono: true })
    const steps = [
      ['1-doza', '20.11 · 08:00', 'done'],
      ['2-doza', '21.11 · 08:00', 'done'],
      ['3-doza', 'Bugun · 16:00', 'next'],
      ['4-doza', '23.11 · 08:00', 'todo'],
    ]
    steps.forEach(([label, when, st], i) => {
      const ry = y + 196 + i * 62
      if (i < steps.length - 1) b += line(x + 17, ry + 18, x + 17, ry + 62, { stroke: st === 'done' ? C.violet : '#d8d8e0', sw: 2, dash: st === 'done' ? '' : '4 4' })
      b += circle(x + 17, ry + 10, 10, { fill: st === 'done' ? C.violet : '#fff', stroke: st === 'todo' ? '#cfcfd8' : C.violet, sw: 2 })
      if (st === 'done') b += `<path d="M ${x + 12} ${ry + 10} l 3.5 3.5 l 6.5 -7" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
      b += text(x + 42, ry + 9, label, { size: 15, weight: 700, fill: st === 'todo' ? C.muted : C.ink })
      b += text(x + 42, ry + 30, `Oksitetratsiklin · ${when}`, { size: 12, fill: C.muted })
    })
    b += rect(x, y + 456, w, 52, { rx: 26, fill: C.violet })
    b += text(x + w / 2, y + 488, 'Dozani belgilash', { size: 15, weight: 700, fill: '#fff', anchor: 'middle' })
    return b
  })
  return s
}

// ── RIIZQ: architecture diagram ──────────────────────────────────────────────
function riizqArchitecture() {
  let s = rect(0, 0, 1600, 1000, { fill: C.night }) + rect(0, 0, 1600, 1000, { fill: 'url(#dotsDark)' })
  s += text(110, 120, 'RIIZQ / SYSTEM ARCHITECTURE', { size: 15, fill: C.violet2, mono: true, ls: 2 })
  s += text(110, 160, 'High-level overview · infrastructure details omitted', { size: 15, fill: 'rgba(255,255,255,.4)', mono: true })
  const node = (x, y, w, h, title, sub, accent = false) =>
    rect(x, y, w, h, { rx: 18, fill: accent ? C.violet : 'rgba(255,255,255,.04)', stroke: accent ? 'none' : 'rgba(255,255,255,.16)' }) +
    text(x + 24, y + 42, title, { size: 22, weight: 750, fill: '#fff', ls: -0.4 }) +
    text(x + 24, y + 68, sub, { size: 13, fill: accent ? 'rgba(255,255,255,.8)' : 'rgba(255,255,255,.5)', mono: true })
  const arrow = (x1, y1, x2, y2, label) => {
    const mx = (x1 + x2) / 2
    return (
      `<path d="M ${x1} ${y1} C ${mx} ${y1} ${mx} ${y2} ${x2} ${y2}" fill="none" stroke="${C.violet2}" stroke-width="2" stroke-dasharray="6 6"/>` +
      circle(x2, y2, 4.5, { fill: C.violet2 }) +
      (label ? text(mx, Math.min(y1, y2) - 12 + Math.abs(y2 - y1) / 2, label, { size: 12, fill: 'rgba(255,255,255,.55)', mono: true, anchor: 'middle' }) : '')
    )
  }
  // boundary
  s += rect(470, 230, 1020, 640, { rx: 28, stroke: 'rgba(255,255,255,.22)', dash: '8 8' })
  s += text(498, 266, 'DOCKER COMPOSE · AWS HOST', { size: 12.5, fill: 'rgba(255,255,255,.55)', mono: true, ls: 1.5 })
  s += node(110, 430, 290, 100, 'React SPA', 'Vite · PWA · uz-Latn')
  s += node(530, 430, 260, 100, 'Caddy', 'HTTPS · static · proxy')
  s += node(900, 430, 290, 100, 'NestJS API', '24 modules · REST', true)
  s += node(900, 650, 290, 100, 'PostgreSQL 16', '44 models via Prisma')
  s += node(1250, 430, 200, 100, 'Redis 7', 'cache · limits')
  s += node(530, 650, 260, 100, 'Migrate job', 'prisma migrate')
  s += node(1250, 650, 200, 100, 'S3', 'backups · files')
  s += arrow(400, 480, 530, 480, 'HTTPS')
  s += arrow(790, 480, 900, 480, '/api')
  s += arrow(1045, 530, 1045, 650, '')
  s += arrow(1190, 480, 1250, 480, '')
  s += arrow(790, 700, 900, 700, '')
  s += arrow(1190, 700, 1250, 700, '')
  // auth layer annotation
  s += rect(900, 290, 550, 92, { rx: 18, fill: 'rgba(107,78,255,.12)', stroke: 'rgba(138,115,255,.45)' })
  s += text(924, 326, 'Auth &amp; access'.replace('&amp;', '&'), { size: 18, weight: 700, fill: '#fff' })
  s += text(924, 354, 'JWT access · rotating refresh sessions · 5 roles · TOTP MFA', { size: 12.5, fill: 'rgba(255,255,255,.65)', mono: true })
  s += line(1045, 382, 1045, 430, { stroke: 'rgba(138,115,255,.6)', sw: 2, dash: '4 6' })
  // CI strip
  s += rect(110, 800, 290, 70, { rx: 16, fill: 'rgba(255,255,255,.04)', stroke: 'rgba(255,255,255,.16)' })
  s += text(134, 832, 'CI · GitHub Actions', { size: 16, weight: 700, fill: '#fff' })
  s += text(134, 854, 'typecheck · tests · scans', { size: 12, fill: 'rgba(255,255,255,.5)', mono: true })
  return s
}

// ── Cargo Bot: abstract concept illustrations (no functionality implied) ─────
function cargoCover() {
  let s = rect(0, 0, 1600, 1000, { fill: C.night }) + rect(0, 0, 1600, 1000, { fill: 'url(#glow)' }) + rect(0, 0, 1600, 1000, { fill: 'url(#dotsDark)' })
  // isometric parcels
  const box = (cx, cy, size, tone) => {
    const h = size * 0.58
    const top = `M ${cx} ${cy - h} L ${cx + size} ${cy - h / 2} L ${cx} ${cy} L ${cx - size} ${cy - h / 2} Z`
    const left = `M ${cx - size} ${cy - h / 2} L ${cx} ${cy} L ${cx} ${cy + size * 0.9} L ${cx - size} ${cy + size * 0.9 - h / 2} Z`
    const right = `M ${cx + size} ${cy - h / 2} L ${cx} ${cy} L ${cx} ${cy + size * 0.9} L ${cx + size} ${cy + size * 0.9 - h / 2} Z`
    const [t, l, r] = tone === 'violet' ? [C.violet2, C.violet, '#4b33d6'] : ['#2a2a33', '#18181f', '#111117']
    return `<path d="${left}" fill="${l}"/><path d="${right}" fill="${r}"/><path d="${top}" fill="${t}"/>` +
      `<path d="M ${cx - size * 0.5} ${cy - h * 0.75} L ${cx + size * 0.5} ${cy - h * 0.25}" stroke="rgba(255,255,255,.35)" stroke-width="${size * 0.08}"/>`
  }
  s += box(1040, 520, 150, 'violet')
  s += box(1250, 640, 96, 'dark')
  s += box(860, 680, 80, 'dark')
  s += box(1230, 380, 60, 'dark')
  // orbit path + nodes
  s += `<path d="M 700 760 C 820 300 1300 220 1460 520" fill="none" stroke="rgba(138,115,255,.6)" stroke-width="2" stroke-dasharray="6 8"/>`
  ;[[700, 760], [930, 410], [1220, 300], [1460, 520]].forEach(([x, y]) => (s += rect(x - 7, y - 7, 14, 14, { fill: '#fff', stroke: C.violet, sw: 2 })))
  s += text(110, 150, 'CARGO BOT', { size: 15, fill: C.violet2, mono: true, ls: 2 })
  s += text(104, 260, 'Automation', { size: 92, weight: 800, fill: '#fff', ls: -4.5 })
  s += text(104, 360, '&amp; backend'.replace('&amp;', '&'), { size: 92, weight: 800, fill: '#fff', ls: -4.5 })
  s += text(110, 420, 'Concept illustration', { size: 15, fill: 'rgba(255,255,255,.45)', mono: true })
  return s
}

function cargoFlow() {
  let s = rect(0, 0, 1600, 1000, { fill: 'url(#bgLight)' }) + rect(0, 0, 1600, 1000, { fill: 'url(#dots)' })
  s += text(110, 140, 'CARGO BOT / FOCUS AREAS', { size: 15, fill: C.violet, mono: true, ls: 2 })
  s += text(110, 176, 'Concept illustration — not a functional diagram', { size: 15, fill: C.muted, mono: true })
  const stages = [
    ['01', 'Backend', 'architecture'],
    ['02', 'Integrations', 'where applicable'],
    ['03', 'Automation', 'workflows'],
    ['04', 'Data', 'processing'],
  ]
  stages.forEach(([n, a, b], i) => {
    const x = 110 + i * 350
    const y = 360 + (i % 2) * 120
    s += rect(x, y, 300, 220, { rx: 24, fill: i === 2 ? C.violet : '#fff', stroke: i === 2 ? 'none' : C.line, filter: 'soft' })
    s += text(x + 28, y + 50, n, { size: 14, fill: i === 2 ? 'rgba(255,255,255,.7)' : C.muted, mono: true })
    s += text(x + 26, y + 140, a, { size: 34, weight: 800, fill: i === 2 ? '#fff' : C.ink, ls: -1.4 })
    s += text(x + 28, y + 174, b, { size: 16, fill: i === 2 ? 'rgba(255,255,255,.8)' : C.ink2 })
    if (i < stages.length - 1) {
      const x1 = x + 300
      const y1 = y + 110
      const x2 = x + 350
      const y2 = 360 + ((i + 1) % 2) * 120 + 110
      s += `<path d="M ${x1} ${y1} C ${x1 + 30} ${y1} ${x2 - 30} ${y2} ${x2} ${y2}" fill="none" stroke="${C.violet}" stroke-width="2.5" stroke-dasharray="5 6"/>`
      s += circle(x2, y2, 5, { fill: C.violet })
    }
  })
  return s
}

// ── Mikka: concept illustrations (product facts from the public overview) ──
function mapScreen({ x, y, w }) {
  let b = rect(x - 22, y - 30, w + 44, 560, { fill: '#ecebf3' })
  // streets
  for (let i = 0; i < 9; i++) b += line(x - 22, y + i * 64, x + w + 22, y + i * 64 - 40, { stroke: '#fff', sw: 7 })
  for (let i = 0; i < 6; i++) b += line(x - 10 + i * 70, y - 30, x + 30 + i * 70, y + 530, { stroke: '#fff', sw: 5 })
  b += `<path d="M ${x + 150} ${y + 250} q 60 -40 120 0 t 40 110 q -70 50 -150 10 z" fill="#dcd6fb"/>`
  b += rect(x, y - 6, w, 44, { rx: 22, fill: '#fff', filter: 'soft' })
  b += text(x + 20, y + 22, 'Search restaurants…', { size: 13.5, fill: C.muted })
  const pins = [
    [x + 70, y + 150, 'S', true],
    [x + 230, y + 120, 'M', false],
    [x + 180, y + 330, 'A', false],
    [x + 270, y + 430, '★', true],
  ]
  pins.forEach(([px, py, label, accent]) => {
    b += `<path d="M ${px} ${py + 34} C ${px - 4} ${py + 20}, ${px - 22} ${py + 14}, ${px - 22} ${py - 4} a 22 22 0 1 1 44 0 C ${px + 22} ${py + 14}, ${px + 4} ${py + 20}, ${px} ${py + 34} Z" fill="${accent ? C.violet : C.ink}"/>`
    b += text(px, py + 2, label, { size: 15, weight: 750, fill: '#fff', anchor: 'middle' })
  })
  b += rect(x + 70 + 30, y + 126, 104, 30, { rx: 15, fill: '#fff', filter: 'soft' })
  b += text(x + 152, y + 146, '10m ago', { size: 12, weight: 600, fill: C.ink2, anchor: 'middle' })
  b += rect(x, y + 470, w, 70, { rx: 18, fill: C.ink })
  b += text(x + 20, y + 498, 'You + Aziz are together', { size: 13.5, weight: 650, fill: '#fff' })
  b += text(x + 20, y + 520, 'Coffee · 5m ago', { size: 12, fill: 'rgba(255,255,255,.55)' })
  return b
}

function mikkaCover() {
  let s = rect(0, 0, 1600, 1000, { fill: C.night }) + rect(0, 0, 1600, 1000, { fill: 'url(#glow)' }) + rect(0, 0, 1600, 1000, { fill: 'url(#dotsDark)' })
  s += text(110, 150, 'MIKKA / THE SOCIAL MAP', { size: 15, fill: C.violet2, mono: true, ls: 2 })
  s += text(104, 260, 'Places.', { size: 96, weight: 800, fill: '#fff', ls: -4.5 })
  s += text(104, 360, 'Friends.', { size: 96, weight: 800, fill: '#fff', ls: -4.5 })
  s += text(104, 460, 'Stories.', { size: 96, weight: 800, fill: C.violet2, ls: -4.5 })
  s += text(110, 520, 'Concept illustration · iOS + Android', { size: 15, fill: 'rgba(255,255,255,.45)', mono: true })
  let cx = 110
  ;['Discover', 'Connect', 'Chat', 'Shorts'].forEach((f) => {
    const c = chip(cx, 560, f, 'dark', { size: 13 })
    s += c.svg
    cx += c.w + 10
  })
  s += phone(1010, 130, '', mapScreen)
  return s
}

function mikkaStack() {
  let s = rect(0, 0, 1600, 1000, { fill: 'url(#bgLight)' }) + rect(0, 0, 1600, 1000, { fill: 'url(#dots)' })
  s += text(110, 130, 'MIKKA / TECH FOUNDATION', { size: 15, fill: C.violet, mono: true, ls: 2 })
  s += text(110, 166, 'High-level overview from the product deck', { size: 15, fill: C.muted, mono: true })
  const node = (x, y, w, h, title, sub, tone = 'light') => {
    const dark = tone === 'dark'
    const violet = tone === 'violet'
    return (
      rect(x, y, w, h, { rx: 22, fill: violet ? C.violet : dark ? C.ink : '#fff', stroke: tone === 'light' ? C.line : 'none', filter: 'soft' }) +
      text(x + 26, y + 50, title, { size: 26, weight: 800, fill: violet || dark ? '#fff' : C.ink, ls: -0.8 }) +
      text(x + 26, y + 80, sub, { size: 13, fill: violet || dark ? 'rgba(255,255,255,.7)' : C.muted, mono: true })
    )
  }
  const wire = (x1, y1, x2, y2) => {
    const mx = (x1 + x2) / 2
    return `<path d="M ${x1} ${y1} C ${mx} ${y1} ${mx} ${y2} ${x2} ${y2}" fill="none" stroke="${C.violet}" stroke-width="2.5" stroke-dasharray="6 7"/>` + circle(x2, y2, 5, { fill: C.violet })
  }
  s += node(110, 300, 300, 120, 'iOS · Android', 'mobile apps')
  s += node(560, 300, 320, 120, 'NestJS API', 'TypeScript · modular', 'violet')
  s += node(1030, 230, 360, 120, 'Supabase', 'Postgres · Auth · Realtime', 'dark')
  s += node(1030, 400, 360, 120, 'Prisma ORM', 'type-safe queries · migrations')
  s += node(560, 560, 320, 120, 'AWS', 'Lightsail · Docker')
  s += wire(410, 360, 560, 360)
  s += wire(880, 340, 1030, 290)
  s += wire(880, 380, 1030, 460)
  s += wire(720, 420, 720, 560)
  const features = ['Discover — map of places', 'Connect — live friends', 'Chat — location-first', 'Shorts — geo-tagged video']
  features.forEach((f, i) => {
    const c = chip(110 + i * 330, 800, f, i === 0 ? 'solid' : 'muted', { size: 14 })
    s += c.svg
  })
  return s
}

// ── Axio: abstract concept (no specific features implied) ───────────────────
function axioCover() {
  let s = rect(0, 0, 1600, 1000, { fill: 'url(#bgLight)' }) + rect(0, 0, 1600, 1000, { fill: 'url(#dots)' })
  s += text(110, 150, 'AXIO / CRM + ERP', { size: 15, fill: C.violet, mono: true, ls: 2 })
  s += text(100, 330, 'Axio', { size: 200, weight: 800, ls: -10 })
  s += circle(522, 314, 22, { fill: C.violet })
  s += text(110, 400, 'One system for customers and operations', { size: 24, weight: 600, fill: C.ink2, ls: -0.5 })
  s += text(110, 440, 'Concept illustration', { size: 15, fill: C.muted, mono: true })
  // two module panels joined by a connector
  const panel = (x, y, label, dark) => {
    let p = rect(x, y, 380, 420, { rx: 28, fill: dark ? C.ink : '#fff', stroke: dark ? 'none' : C.line, filter: 'soft' })
    p += text(x + 30, y + 64, label, { size: 44, weight: 800, fill: dark ? '#fff' : C.ink, ls: -1.5 })
    for (let i = 0; i < 5; i++) {
      const yy = y + 110 + i * 56
      p += circle(x + 46, yy + 14, 14, { fill: dark ? 'rgba(255,255,255,.12)' : C.tint })
      p += rect(x + 74, yy + 4, 150 + ((i * 47) % 90), 10, { rx: 5, fill: dark ? 'rgba(255,255,255,.22)' : '#e4e4ec' })
      p += rect(x + 74, yy + 20, 90 + ((i * 31) % 60), 8, { rx: 4, fill: dark ? 'rgba(255,255,255,.1)' : '#efeff4' })
      p += rect(x + 300, yy + 6, 50, 18, { rx: 9, fill: i % 2 ? (dark ? C.violet2 : C.violet) : dark ? 'rgba(255,255,255,.14)' : '#ececf1' })
    }
    return p
  }
  s += panel(760, 300, 'CRM', false)
  s += panel(1160, 360, 'ERP', true)
  s += `<path d="M 1140 520 C 1150 520, 1150 560, 1160 560" fill="none" stroke="${C.violet}" stroke-width="3" stroke-dasharray="6 6"/>`
  s += circle(1140, 520, 6, { fill: C.violet }) + circle(1160, 560, 6, { fill: C.violet })
  return s
}

// ── Experiments: built from real repo data ───────────────────────────────────
async function loadSilhouette() {
  const src = await readFile(path.join(root, 'src/data/silhouette.ts'), 'utf8')
  return {
    d: /d: '([^']+)'/.exec(src)[1],
    viewBox: /viewBox: '([^']+)'/.exec(src)[1].split(' ').map(Number),
    points: Number(/points: (\d+)/.exec(src)[1]),
  }
}

function anchorsFromPath(d) {
  const nums = d.match(/-?\d*\.?\d+/g).map(Number)
  const cmds = d.match(/[MLCZ]/g)
  const pts = []
  let i = 0
  for (const c of cmds) {
    if (c === 'Z') continue
    if (c === 'M' || c === 'L') {
      pts.push({ x: nums[i], y: nums[i + 1] })
      i += 2
    } else {
      pts.push({ x: nums[i + 4], y: nums[i + 5], h1: [nums[i], nums[i + 1]], h2: [nums[i + 2], nums[i + 3]] })
      i += 6
    }
  }
  return pts
}

function experimentsCover(sil) {
  const [vx, vy, vw, vh] = sil.viewBox
  const scale = 760 / vh
  const ox = 1600 - vw * scale - 150
  const oy = 120
  let s = rect(0, 0, 1600, 1000, { fill: C.paper }) + rect(0, 0, 1600, 1000, { fill: 'url(#dots)' })
  // guides
  s += line(0, oy, 1600, oy, { stroke: C.violet, dash: '6 6', opacity: 0.35 })
  s += line(0, oy + vh * scale, 1600, oy + vh * scale, { stroke: C.violet, dash: '6 6', opacity: 0.35 })
  s += line(ox, 0, ox, 1000, { stroke: C.violet, dash: '6 6', opacity: 0.35 })
  s += line(ox + vw * scale, 0, ox + vw * scale, 1000, { stroke: C.violet, dash: '6 6', opacity: 0.35 })
  s += `<g transform="translate(${ox} ${oy}) scale(${scale}) translate(${-vx} ${-vy})">`
  s += `<path d="${sil.d}" fill="${C.ink}" fill-opacity=".06" stroke="${C.violet}" stroke-width="${2.2 / scale}"/>`
  const pts = anchorsFromPath(sil.d)
  pts.forEach((p, i) => {
    if (p.h2 && i % 3 === 0) {
      s += line(p.h2[0], p.h2[1], p.x, p.y, { stroke: C.ink2, sw: 1 / scale, opacity: 0.6 })
      s += circle(p.h2[0], p.h2[1], 3 / scale, { fill: '#fff', stroke: C.ink2, sw: 1 / scale })
    }
    const r = 4 / scale
    s += rect(p.x - r, p.y - r, r * 2, r * 2, { fill: '#fff', stroke: C.violet, sw: 1.4 / scale })
  })
  s += '</g>'
  // selection frame
  const fx = ox - 12
  const fy = oy - 12
  const fw = vw * scale + 24
  const fh = vh * scale + 24
  s += rect(fx, fy, fw, fh, { stroke: C.violet, sw: 2 })
  ;[[fx, fy], [fx + fw, fy], [fx, fy + fh], [fx + fw, fy + fh]].forEach(([x, y]) => (s += rect(x - 6, y - 6, 12, 12, { fill: '#fff', stroke: C.violet, sw: 2 })))
  s += rect(fx + fw / 2 - 70, fy + fh + 14, 140, 28, { rx: 6, fill: C.violet })
  s += text(fx + fw / 2, fy + fh + 33, `${Math.round(fw)} × ${Math.round(fh)}`, { size: 13, weight: 600, fill: '#fff', anchor: 'middle', mono: true })
  s += text(110, 150, 'DEVELOPER EXPERIMENTS', { size: 15, fill: C.violet, mono: true, ls: 2 })
  s += text(104, 270, 'Bitmap', { size: 104, weight: 800, ls: -5 })
  s += text(104, 380, '→ vector', { size: 104, weight: 800, ls: -5, fill: C.violet })
  s += text(110, 440, `sharp + potrace · ${sil.points} anchors`, { size: 18, fill: C.ink2, mono: true })
  return s
}

function decodePeaks(file, bars = 56) {
  const res = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', file, '-f', 's16le', '-ac', '1', '-ar', '8000', '-'], {
    maxBuffer: 1 << 24,
  })
  if (res.status !== 0) return { peaks: new Array(bars).fill(0.1), duration: 0 }
  const buf = res.stdout
  const samples = new Int16Array(buf.buffer, buf.byteOffset, Math.floor(buf.length / 2))
  const per = Math.max(1, Math.floor(samples.length / bars))
  const peaks = []
  for (let b = 0; b < bars; b++) {
    let m = 0
    for (let i = b * per; i < Math.min(samples.length, (b + 1) * per); i++) m = Math.max(m, Math.abs(samples[i]))
    peaks.push(m / 32768)
  }
  return { peaks, duration: samples.length / 8000 }
}

function experimentsSound() {
  const names = ['key', 'key2', 'pop', 'tick', 'toggle', 'whoosh', 'swell']
  let s = rect(0, 0, 1600, 1000, { fill: C.night }) + rect(0, 0, 1600, 1000, { fill: 'url(#dotsDark)' })
  s += text(110, 130, 'PROCEDURAL SOUND KIT', { size: 15, fill: C.violet2, mono: true, ls: 2 })
  s += text(110, 166, 'Synthesised with ffmpeg expressions · waveforms decoded from public/audio', { size: 15, fill: 'rgba(255,255,255,.45)', mono: true })
  names.forEach((name, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = 110 + col * 700
    const y = 220 + row * 180
    const w = i === 6 ? 1380 : 680
    const { peaks, duration } = decodePeaks(path.join(root, 'public/audio', `${name}.mp3`), i === 6 ? 120 : 56)
    s += rect(x, y, w, 160, { rx: 20, fill: 'rgba(255,255,255,.04)', stroke: 'rgba(255,255,255,.1)' })
    s += text(x + 26, y + 44, name, { size: 24, weight: 750, fill: '#fff', ls: -0.5 })
    s += text(x + w - 26, y + 44, `${(duration * 1000).toFixed(0)} ms`, { size: 13, fill: 'rgba(255,255,255,.5)', anchor: 'end', mono: true })
    const bw = (w - 52) / peaks.length
    const max = Math.max(...peaks, 0.01)
    peaks.forEach((p, j) => {
      const h = Math.max(2, (p / max) * 70)
      s += rect(x + 26 + j * bw, y + 105 - h / 2, Math.max(1.5, bw - 3), h, { rx: 1.5, fill: j % 7 === 0 ? C.violet2 : C.violet, opacity: 0.55 + 0.45 * (p / max) })
    })
  })
  return s
}

function experimentsMotion() {
  let s = rect(0, 0, 1600, 1000, { fill: 'url(#bgLight)' }) + rect(0, 0, 1600, 1000, { fill: 'url(#dots)' })
  s += text(110, 130, 'HERO INTRO · TIMELINE', { size: 15, fill: C.violet, mono: true, ls: 2 })
  s += text(110, 166, 'GSAP timeline · 7.5 s · three stages · reduced-motion aware', { size: 15, fill: C.muted, mono: true })
  const x0 = 330
  const x1 = 1490
  const sec = (t) => x0 + ((x1 - x0) / 7.5) * t
  // ruler
  for (let t = 0; t <= 7.5; t += 0.5) {
    const x = sec(t)
    s += line(x, 220, x, Number.isInteger(t) ? 244 : 234, { stroke: C.ink2, sw: 1.2 })
    if (Number.isInteger(t)) s += text(x, 212, `${t}s`, { size: 12, fill: C.muted, mono: true, anchor: 'middle' })
  }
  s += line(x0, 244, x1, 244, { stroke: C.ink2 })
  const tracks = [
    ['A', 'Guides', 0, 0.9],
    ['A', 'Type HELLO', 0.35, 1.45],
    ['A', 'Canvas flip', 1.55, 2.0],
    ['A', 'Selection + px', 1.9, 2.9],
    ['B', 'Vector trace', 3.0, 4.7],
    ['B', 'Pen + counter', 3.0, 4.7],
    ['B', 'Fill', 4.55, 5.05],
    ['C', 'Move right', 5.05, 5.85],
    ['C', 'I’M + DALER', 5.35, 6.3],
    ['C', 'Dot pop', 6.25, 6.6],
    ['C', 'Role · copy · CTA', 6.45, 7.5],
  ]
  tracks.forEach(([stage, label, a, b], i) => {
    const y = 270 + i * 58
    s += text(110, y + 27, `${stage} · ${label}`, { size: 15, weight: 600, fill: C.ink2 })
    s += line(x0, y + 22, x1, y + 22, { stroke: '#e2e2ea', dash: '2 6' })
    const tone = stage === 'B' ? C.violet : stage === 'C' ? C.ink : C.violet2
    s += rect(sec(a), y + 6, sec(b) - sec(a), 32, { rx: 9, fill: tone })
    s += rect(sec(a) + 8, y + 18, 8, 8, { rx: 1, fill: '#fff', opacity: 0.85 })
  })
  // playhead
  s += line(sec(4.1), 200, sec(4.1), 930, { stroke: C.violet, sw: 2 })
  s += rect(sec(4.1) - 34, 186, 68, 26, { rx: 6, fill: C.violet })
  s += text(sec(4.1), 204, '04:03', { size: 12.5, weight: 600, fill: '#fff', anchor: 'middle', mono: true })
  return s
}

function ogImage(sil) {
  const [vx, vy, vw, vh] = sil.viewBox
  const scale = 520 / vh
  let s = rect(0, 0, 1200, 630, { fill: C.night }) + rect(0, 0, 1200, 630, { fill: 'url(#glow)' }) + rect(0, 0, 1200, 630, { fill: 'url(#dotsDark)' })
  s += `<g transform="translate(${1200 - vw * scale - 40} ${630 - vh * scale}) scale(${scale}) translate(${-vx} ${-vy})"><path d="${sil.d}" fill="#000" stroke="${C.violet2}" stroke-width="${2 / scale}"/></g>`
  s += text(70, 120, 'FULL-STACK DEVELOPER', { size: 20, fill: C.violet2, mono: true, ls: 3 })
  s += text(62, 360, 'DALER', { size: 210, weight: 800, fill: '#fff', ls: -11 })
  s += circle(686, 342, 22, { fill: C.violet })
  s += text(70, 430, 'React · TypeScript · NestJS · PostgreSQL · AWS', { size: 22, fill: 'rgba(255,255,255,.6)', mono: true })
  return svgDoc(1200, 630, s)
}

// ── Render ───────────────────────────────────────────────────────────────────
const sil = await loadSilhouette()
const jobs = [
  ['riizq-dashboard', riizqDashboard()],
  ['riizq-mobile', riizqMobile()],
  ['riizq-pharmacy', riizqPharmacy()],
  ['riizq-architecture', riizqArchitecture()],
  ['mikka-cover', mikkaCover()],
  ['mikka-stack', mikkaStack()],
  ['axio-cover', axioCover()],
  ['cargo-cover', cargoCover()],
  ['cargo-flow', cargoFlow()],
  ['experiments-vector', experimentsCover(sil)],
  ['experiments-sound', experimentsSound()],
  ['experiments-motion', experimentsMotion()],
]

console.log('› rendering project imagery')
for (const [name, body] of jobs) {
  const svg = Buffer.from(svgDoc(1600, 1000, body))
  const img = sharp(svg, { density: 96 })
  await img.clone().webp({ quality: 84, effort: 5 }).toFile(path.join(OUT, `${name}.webp`))
  await img.clone().resize(800).webp({ quality: 80, effort: 5 }).toFile(path.join(OUT, `${name}-800.webp`))
  console.log(`  ✓ ${name}`)
}
await sharp(Buffer.from(ogImage(sil))).png({ compressionLevel: 9 }).toFile(path.join(root, 'public/og.png'))
console.log('  ✓ og.png')
console.log('✓ done')
