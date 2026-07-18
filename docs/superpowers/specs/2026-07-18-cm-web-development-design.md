# cm-web-development — Services Site Design

**Date:** 2026-07-18
**Author:** Chris Dave Magahis (with Claude)
**Status:** Approved design → ready for implementation plan

---

## 1. Purpose

A new, standalone marketing site whose job is to **win web-development work**. It is a
separate second site from the existing `chrizrock.github.io` portfolio (which stays live
unchanged). The site is itself the proof of skill: hand-coded, fast, and distinctive.

- **Primary goal:** convert a visiting prospect into a contact/enquiry.
- **Positioning:** the **rebuild specialist** — *"I build websites that convert. And rebuild
  the ones that don't."* Results-led hook, with craft and AI-augmented delivery as supporting
  proof throughout.
- **Audience:** SMB owners, agencies, and e-commerce merchants who need a new site or a
  rebuild of an underperforming one.

## 2. Success criteria

- Five pages ship as pure static HTML/CSS/JS on GitHub Pages, no runtime dependencies.
- A visitor understands *what he does* and *why hire him* within the first screen of Home.
- The Work page reproduces the signature before/after interaction across all 17 real projects.
- Contact form works end-to-end (submissions reach his email via Formspree).
- Dark + light themes, both flash-free; motion honors `prefers-reduced-motion`.
- Accessibility: touch targets ≥44px, visible focus rings, skip link, semantic landmarks,
  `aria-pressed` on toggles.
- Lighthouse: performance and accessibility in the green; no layout shift (transform/opacity
  animation only).

## 3. Scope

### In scope
- 5 pages: Home, Services, Work, About, Contact.
- Dark-premium visual system with a light mode; teal/cyan accent + teal→violet glow.
- Reuse of existing real assets: 17 projects + before/after screenshots, portrait, monogram,
  CV content.
- A dev-only Node build that generates the pages and the Work grid from a data file.
- Formspree contact form + direct contact channels.
- Favicon + OG/social preview images from the monogram.

### Out of scope (YAGNI)
- No blog/CMS. No backend beyond the Formspree endpoint. No analytics in v1 (can add the same
  cookieless GoatCounter later). No fabricated testimonials/stats — a real-testimonials slot is
  designed but left empty until he supplies real ones. No custom domain wiring in v1 (GitHub
  Pages default URL; domain can be pointed later).

## 4. Location & deployment

- **Folder / repo:** `C:\Users\davec\OneDrive\Desktop\cm-web-development` — its own git repo.
- **Host:** new GitHub repository → GitHub Pages. `.nojekyll` present.
- **Form:** Formspree endpoint. Built with a clearly-marked placeholder
  (`https://formspree.io/f/REPLACE_ME`) that he swaps for his real endpoint.

## 5. Architecture — hand-coded, data-generated

Mirrors the existing site's philosophy (generate from data so content can't drift), extended to
a 5-page marketing site. **The shipped site is pure static HTML/CSS/JS; the build is dev-only.**

```
cm-web-development/
  _build/
    data/
      site.json         nav, footer, contact channels, meta/OG, stats, services
      projects.json     the 17 projects (copied from the existing site, extended as needed)
      cv.json           About-page content (copied/derived from existing cv-data.json)
    partials/           header, footer, head — single source, no per-page drift
    pages/              per-page section templates (home, services, work, about, contact)
    build.mjs           renders all 5 pages + the Work grid → site root
  assets/
    css/styles.css      one stylesheet, design tokens (light + dark)
    js/main.js          theme (pre-paint), scroll-reveal, before/after wipe, form, filters
    fonts/              self-hosted woff2 (Space Grotesk, Inter) — no CDN
    img/                shots/ (before/after), logo/ (monogram), portrait, og images
  index.html            generated
  services.html         generated
  work.html             generated
  about.html            generated
  contact.html          generated
  .nojekyll
  README.md
```

**Component boundaries**
- `build.mjs` — reads `data/*`, composes `partials/` + `pages/`, writes the 5 HTML files. Pure
  function of the data; re-runnable; the only place HTML is assembled.
- `partials/` — header, footer, `<head>` shared across every page (kills nav/footer drift).
- `data/` — the single source of truth for content. Editing data + rebuild = updated site.
- `main.js` — isolated, progressively-enhanced behaviors, each independent:
  theme resolve/toggle, IntersectionObserver reveal, before/after clip-path wipe, Work filters,
  form UX (client validation + Formspree submit + success/error states).
- `styles.css` — tokens (`--bg`, `--surface`, `--accent`, type ramp, spacing scale) with a
  `:root` dark default and a light override; every component reads tokens.

*Alternatives rejected:* (B) five hand-authored HTML files, no build — nav/footer duplicate and
drift; (C) an SSG (Astro/11ty) — adds a framework, contradicts the zero-dependency brand.

## 6. Visual language — "Dark premium + motion"

- **Canvas:** deep desaturated navy-black with layered elevated surfaces (depth, not flat black).
- **Accent:** signature electric **teal/cyan**, used sparingly; controlled **teal→violet** glow
  behind the hero and section anchors. One disciplined accent.
- **Type:** **Space Grotesk** (display, oversized headlines) + **Inter** (body), self-hosted woff2.
- **Motion (GPU-only — `transform`/`opacity`; full `prefers-reduced-motion` off-switch):**
  scroll-reveal, slow living hero glow, magnetic hover on buttons/cards, and the signature
  before/after clip-path wipe (laptop + phone).
- **Light + dark:** dark is the primary identity; a fully-designed, equally-premium light mode
  with the theme toggle, resolved before first paint (no flash). Monogram flips color from one
  vector via `currentColor`.
- Palette/spacing/type-ramp/component-states to be refined through the **ui-ux-pro-max** and
  **frontend-design** skills during build, so it reads intentional, not a templated dark theme.

## 7. Pages

### Home — win the prospect in 5 seconds
- Glass sticky nav: monogram · Services · Work · About · Contact · **"Start a project"** CTA.
- Hero: animated glow; signature line *"I build websites that convert. And rebuild the ones that
  don't."* + rebuild-specialist subhead; two CTAs (See the before/after · Start a project).
- Stat band (bento): `20+ yrs` · `17 rebuilds shown` · `3 countries` · `0 frameworks`.
- What I do: 4 condensed service cards → Services.
- Featured work: the 3 featured before/afters (interactive wipe) → Work.
- Differentiator band: *"Hand-coded fundamentals. AI-augmented delivery."* (craft + Devy as proof).
- (Reserved, empty until real) testimonials slot.
- Closing CTA band → Contact.
- Footer: contact channels, monogram, links.

### Services — the sales page
- Detailed blocks (each: what it is · what you get · who it's for):
  **Rebuilds & Redesigns** (lead — the specialty) · **New Website Builds** ·
  **E-Commerce & Cart/Theme Upgrades** (PinnacleCart, Shopify) ·
  **WordPress Care & Hosting** (WP Engine) · **AI-Augmented Delivery** (Devy differentiator).
- "How I work": Audit → Design → Build → QA (real pixel-parity / cross-browser angle) → Launch.
- Platforms strip → CTA.

### Work — all 17 + featured tier
- Category filters: All · Redesigns · Cart & Theme Upgrades · New Builds.
- **Featured tier:** 3–4 elevated before/afters, large, interactive wipe (laptop + phone).
- Compact grid of the rest, each opening its before/after. Live counter.
- Data + screenshots reused from the existing site.

### About — the human + the credibility
- Portrait + summary/story (PH → UAE → US, 20+ years), skills grid, condensed experience
  highlights, "why me" values, **Download CV (PDF)** button → Contact CTA.

### Contact
- Working **Formspree** form: name · email · project type (select) · message; client validation;
  success/error states; honeypot for spam.
- Direct channels: email · WhatsApp · Discord · GitHub. Availability line + remote/location +
  response-time note.

## 8. Content & assets

All real, reused from the existing repo: 17 projects + before/after screenshots (desktop +
mobile), portrait (`photo.jpg`), monogram set (theme-flipping vector), CV text. **Nothing
fabricated** — no invented testimonials, stats, or client quotes.

## 9. Accessibility & performance (carried over from his existing standards)

- Theme resolved before first paint (no flash).
- Touch targets ≥44px; visible focus rings; skip link; `aria-pressed` on before/after + theme
  toggles; semantic landmarks and heading order.
- `prefers-reduced-motion`: every animation switched off, not merely shortened.
- Transform/opacity only — no layout animation, no reflow, no CLS.
- Portrait as a genuinely square file (not CSS `aspect-ratio`) for old in-app WebViews.

## 10. Testing / verification

- `build.mjs` runs clean and regenerates all 5 pages deterministically from data.
- Manual pass at 1440 / 768 / 390 in the browser (drive the real pages via the run/verify flow).
- Before/after wipe, Work filters, theme toggle (no flash), and form submit all exercised.
- Form verified against a real Formspree endpoint (or placeholder validated + documented).
- Links/assets resolve; no console errors; reduced-motion honored.
- Lighthouse performance + accessibility checked before calling it done.

## 11. Open items to resolve during build

- Real Formspree endpoint URL (placeholder until provided).
- Final copy for Services blocks and the About narrative (drafted from CV, his review).
- Which 3–4 projects sit in the Work "featured" tier (default: the 3 currently `featured:true`
  + one strong cart-upgrade, e.g. Bevel Heaven).
