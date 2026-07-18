# cm-web-development Services Site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dark-premium, motion-led 5-page marketing site that wins web-development work, hand-coded and data-generated with zero runtime dependencies.

**Architecture:** A dev-only Node build (`build.mjs`, Node built-ins only) composes shared partials + per-page section templates from JSON data into 5 static HTML files. The shipped site is pure static HTML/CSS/JS on GitHub Pages. Content lives in `_build/data/*.json` (single source of truth) so nav, footer, and project data never drift across pages.

**Tech Stack:** Node 18+ (built-in `node:test`, `node:fs`, no npm dependencies), hand-written HTML/CSS/JS, self-hosted woff2 fonts (Space Grotesk + Inter), Formspree for the contact form.

## Global Constraints

- **Zero runtime dependencies** in the shipped site: no framework, no CSS library, no CDN, no external font/script requests. Build tooling uses Node built-ins only.
- **Node ES modules** (`"type": "module"`); every build file is `.mjs`.
- **Motion:** animate `transform`/`opacity` only — never layout properties. No CLS.
- **`prefers-reduced-motion: reduce`** switches every animation fully off (not shortened).
- **Theme resolved before first paint** (inline head script) — no flash. Dark is default.
- **Accessibility:** touch targets ≥44px; visible focus rings; skip link; `aria-pressed` on before/after + theme toggles; semantic landmarks; correct heading order.
- **Accent:** signature teal/cyan primary + teal→violet glow. One disciplined accent.
- **No fabricated content:** no invented testimonials, stats, client quotes, or credentials. Only real, sourced content reused from the existing portfolio.
- **Formspree endpoint** is a clearly-marked placeholder `https://formspree.io/f/REPLACE_ME` until the real URL is supplied.
- Source assets to reuse live in `C:\Users\davec\OneDrive\Desktop\Portfolio-Site` (`shots/`, `logo/`, `shots/photo.jpg`, `Chris_Dave_Magahis_CV.pdf`, `_build/cv-data.json`, `_build/projects.json`).
- Design tokens (dark): `--bg:#0A0E14`, `--surface:#111826`, `--surface-2:#182234`, `--text:#E6EDF6`, `--muted:#9FB0C3`, `--accent:#2DD4BF` (teal), `--accent-2:#8B7CF6` (violet, glow only), `--border:#243043`. Light mode overrides these on `:root[data-theme="light"]`. Type ramp uses `clamp()`; base 16px, display via Space Grotesk.

---

## File Structure

```
cm-web-development/
  package.json                 { "type":"module", scripts: build, test, serve }
  .nojekyll
  README.md
  _build/
    data/
      site.json                nav, footer, contact channels, meta/OG, stats, services
      projects.json            17 projects (copied from existing site)
      cv.json                  About-page content (derived from existing cv-data.json)
    partials/
      head.mjs                 <head> incl. pre-paint theme script + meta/OG
      header.mjs               glass sticky nav
      footer.mjs               footer
      components.mjs           reusable HTML fragments (button, section, beforeAfter, statTile, serviceCard, projectCard)
    pages/
      home.mjs                 Home sections → main HTML
      services.mjs             Services sections
      work.mjs                 Work: filters + featured tier + grid
      about.mjs                About from cv.json
      contact.mjs              Contact + form
    build.mjs                  reads data, composes partials+pages, writes 5 HTML files
    lib/
      render.mjs               tiny helpers: html-escape, attr, join, page-shell
  test/
    build.test.mjs             node:test: pages generated, no drift, data integrity
    data.test.mjs              node:test: assets exist for every project, data shape
  assets/
    css/styles.css
    js/main.js
    fonts/                     space-grotesk-*.woff2, inter-*.woff2
    img/
      shots/                   before/after (copied)
      logo/                    monogram (copied)
      portrait.jpg             (copied from shots/photo.jpg)
      og/                      generated social preview(s)
    cv/Chris_Dave_Magahis_CV.pdf
  index.html services.html work.html about.html contact.html   (generated)
```

---

### Task 1: Project scaffold, assets, and data

**Files:**
- Create: `package.json`, `.nojekyll`, `_build/lib/render.mjs`
- Create: `_build/data/site.json`, `_build/data/projects.json`, `_build/data/cv.json`
- Copy in: `assets/img/shots/*`, `assets/img/logo/*`, `assets/img/portrait.jpg`, `assets/cv/Chris_Dave_Magahis_CV.pdf`
- Test: `test/data.test.mjs`

**Interfaces:**
- Produces: `render.mjs` exports `esc(str)`, `attr(obj)`, `html(strings, ...values)` (tagged template that escapes interpolations unless wrapped in `raw()`), `raw(str)`.
- Produces: `data/site.json` shape `{ meta, nav:[{label,href}], contact:{email,whatsapp,discord,github,location}, stats:[{value,label}], services:[{id,title,summary,forWho,bullets:[]}] }`.
- Produces: `data/projects.json` — array copied verbatim from existing site (17 items, each `{slug,name,kind,type,platform,featured,role,blurb,summary:[],tags:[],live,old?}`).

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "cm-web-development",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "build": "node _build/build.mjs",
    "test": "node --test",
    "serve": "node --watch-path=_build _build/build.mjs & npx --yes serve@14 -l 5050 ."
  }
}
```

- [ ] **Step 2: Copy real assets from the existing site** (run from repo root)

```bash
SRC="/c/Users/davec/OneDrive/Desktop/Portfolio-Site"
mkdir -p assets/img/shots assets/img/logo assets/img/og assets/cv assets/fonts _build/data _build/partials _build/pages _build/lib test
cp -r "$SRC/shots/." assets/img/shots/
cp -r "$SRC/logo/." assets/img/logo/
cp "$SRC/shots/photo.jpg" assets/img/portrait.jpg
cp "$SRC/Chris_Dave_Magahis_CV.pdf" assets/cv/Chris_Dave_Magahis_CV.pdf
cp "$SRC/_build/projects.json" _build/data/projects.json
touch .nojekyll
```

- [ ] **Step 3: Write `_build/lib/render.mjs`**

```js
export const esc = (s) => String(s ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");
const RAW = Symbol("raw");
export const raw = (s) => ({ [RAW]: String(s) });
const render = (v) => (v && v[RAW] !== undefined) ? v[RAW]
  : Array.isArray(v) ? v.map(render).join("") : esc(v);
export const html = (strings, ...values) =>
  raw(strings.reduce((out, s, i) => out + s + (i < values.length ? render(values[i]) : ""), ""));
export const attr = (o) => Object.entries(o)
  .filter(([, v]) => v != null && v !== false)
  .map(([k, v]) => v === true ? ` ${k}` : ` ${k}="${esc(v)}"`).join("");
```

- [ ] **Step 4: Write `_build/data/site.json`** — real content (nav, contact channels from CV, stats, service blocks). Contact values: email `chriz.magahis@gmail.com`, whatsapp `+63 969 282 1388` / `https://wa.me/639692821388`, discord `chrizmagahis`, github `https://github.com/chrizrock`, location `Philippines · Remote`. Stats: `20+ / Years`, `17 / Rebuilds shown`, `3 / Countries`, `0 / Frameworks`. Services array: `rebuilds`, `new-builds`, `ecommerce`, `wordpress-care`, `ai-delivery` (title/summary/forWho/bullets each — real, drawn from the CV).

- [ ] **Step 5: Write `_build/data/cv.json`** — derive About content from `Portfolio-Site/_build/cv-data.json`: `summary`, `skills` (grouped), condensed `experience` highlights, `education`, `languages`. Read the source file, extract, do not invent.

- [ ] **Step 6: Write the failing test `test/data.test.mjs`**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const projects = JSON.parse(readFileSync("_build/data/projects.json", "utf8"));
const site = JSON.parse(readFileSync("_build/data/site.json", "utf8"));

test("17 projects present", () => assert.equal(projects.length, 17));

test("every project has after screenshots (desktop+mobile)", () => {
  for (const p of projects) {
    assert.ok(existsSync(`assets/img/shots/${p.slug}-after-desktop.jpg`), `${p.slug} after-desktop`);
    assert.ok(existsSync(`assets/img/shots/${p.slug}-after-mobile.jpg`), `${p.slug} after-mobile`);
  }
});

test("projects with an 'old' url have before screenshots", () => {
  for (const p of projects.filter((p) => p.old)) {
    assert.ok(existsSync(`assets/img/shots/${p.slug}-before-desktop.jpg`), `${p.slug} before-desktop`);
  }
});

test("site.json has required blocks", () => {
  assert.ok(Array.isArray(site.nav) && site.nav.length >= 4);
  assert.ok(site.contact.email.includes("@"));
  assert.ok(site.services.length >= 4);
});
```

- [ ] **Step 7: Run the test, confirm pass**

Run: `node --test test/data.test.mjs`
Expected: PASS (4 tests). If a screenshot assertion fails, the copy in Step 2 was incomplete — fix and re-run.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "Scaffold, copy real assets, seed data + data tests"
```

---

### Task 2: Build engine + shared shell (partials)

**Files:**
- Create: `_build/partials/head.mjs`, `_build/partials/header.mjs`, `_build/partials/footer.mjs`
- Create: `_build/build.mjs`
- Test: `test/build.test.mjs`

**Interfaces:**
- Consumes: `render.mjs` (`html`, `raw`, `esc`, `attr`), `data/site.json`.
- Produces: `head.mjs` default export `head({title, description, page})` → `raw` `<head>` incl. inline pre-paint theme script and OG tags.
- Produces: `header.mjs` default export `header({page})` → nav with `aria-current` on the active page.
- Produces: `footer.mjs` default export `footer()`.
- Produces: `build.mjs` exports `pageShell({page, title, description, main})` and a `build()` that writes all 5 files; running the file executes `build()`.

- [ ] **Step 1: Write `_build/partials/head.mjs`** — returns `<head>` with charset/viewport, `<title>`, meta description, canonical, OG/Twitter tags (from `site.meta`), favicon (`assets/img/logo/...square...png`), preloaded self-hosted fonts, `assets/css/styles.css`, and this inline pre-paint script:

```html
<script>
  try {
    var t = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", t);
  } catch (e) { document.documentElement.setAttribute("data-theme", "dark"); }
</script>
```

- [ ] **Step 2: Write `header.mjs` and `footer.mjs`** — glass sticky nav: monogram (inline SVG using `currentColor` from `logo/cm-logo-current.svg`), nav links from `site.nav` with `aria-current="page"` when `link.href === page`, a "Start a project" CTA to `contact.html`, and a theme-toggle button (`aria-pressed`, `aria-label`). Footer: contact channels, monogram, nav, remote/location line. Both read `site.json`; no hard-coded duplication.

- [ ] **Step 3: Write `_build/build.mjs`** — `pageShell` wraps `<!doctype html><html lang="en" data-theme="dark">` + `head(...)` + `<body>` (skip link, `header`, `<main id="main">`, `footer`, `<script type="module" src="assets/js/main.js">`). `build()` imports the 5 page modules, renders each `main`, writes `index.html`, `services.html`, `work.html`, `about.html`, `contact.html` to repo root. Use stub page modules returning `<main>…</main>` for now (real content in later tasks).

- [ ] **Step 4: Write the failing test `test/build.test.mjs`**

```js
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

before(() => execSync("node _build/build.mjs"));
const read = (f) => readFileSync(f, "utf8");
const PAGES = ["index.html","services.html","work.html","about.html","contact.html"];

test("all 5 pages generated with a shell", () => {
  for (const f of PAGES) {
    const h = read(f);
    assert.match(h, /<!doctype html>/i, `${f} doctype`);
    assert.match(h, /id="main"/, `${f} main landmark`);
    assert.match(h, /class="[^"]*skip[^"]*"/i, `${f} skip link`);
  }
});

test("header + footer identical across pages (no drift)", () => {
  const grab = (h, tag) => h.match(new RegExp(`<${tag}[\\s\\S]*?</${tag}>`))[0];
  const norm = (s) => s.replace(/aria-current="page"/g, "");
  const headers = PAGES.map((f) => norm(grab(read(f), "header")));
  const footers = PAGES.map((f) => grab(read(f), "footer"));
  assert.ok(headers.every((h) => h === headers[0]), "headers differ beyond active state");
  assert.ok(footers.every((h) => h === footers[0]), "footers differ");
});

test("active nav marked per page", () => {
  assert.match(read("services.html"), /aria-current="page"[^>]*>\s*Services|Services[\s\S]{0,40}aria-current="page"/);
});
```

- [ ] **Step 5: Run the test, confirm fail then pass**

Run: `node --test test/build.test.mjs`
Expected first: FAIL (files not yet generated / assertions). Implement until PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "Build engine + shared shell with no-drift tests"
```

---

### Task 3: Design system — tokens, typography, nav, footer, buttons + theme JS

**Files:**
- Create: `assets/css/styles.css`
- Create: `assets/js/main.js`
- Add: self-hosted `assets/fonts/*.woff2` (Space Grotesk 500/700, Inter 400/500/600)

**Interfaces:**
- Consumes: the shell + partials from Task 2.
- Produces: CSS custom properties on `:root` (dark) and `:root[data-theme="light"]`; utility/layout classes (`.container`, `.section`, `.btn`, `.btn--primary`, `.glass`, `.grid`); `main.js` exports nothing but wires the theme toggle (persist to `localStorage`, flip `data-theme`, update `aria-pressed`).

- [ ] **Step 1:** Invoke **ui-ux-pro-max** (dark premium / SaaS-portfolio direction) and the **frontend-design** skill to lock the palette, spacing scale, type ramp, elevation, and component states before writing CSS. Record the resulting token values (seed from Global Constraints).
- [ ] **Step 2:** Add the woff2 font files to `assets/fonts/` and `@font-face` them in CSS (`font-display: swap`), `preload` in `head.mjs`. No external font requests.
- [ ] **Step 3:** Write `styles.css`: `@layer` order (reset, tokens, base, layout, components, utilities); tokens for both themes; base typography (Space Grotesk display, Inter body, `clamp()` ramp); `.container` (max ~1200px), section rhythm; glass sticky nav (backdrop-filter, border, blur) with a scrolled state; footer; button variants with hover/focus-visible states; focus rings; `:target`/skip-link styles; `@media (prefers-reduced-motion: reduce)` global off-switch.
- [ ] **Step 4:** Write `main.js` theme toggle: read/persist `localStorage.theme`, toggle `data-theme`, sync `aria-pressed` and label. (Pre-paint script already set the initial value in `head.mjs`.)
- [ ] **Step 5: Verify in the browser** (use the `run`/`verify` flow): serve the site, load `index.html` at 1440/768/390. Confirm: fonts load with no external request (check network panel — only local), nav is sticky/glass, theme toggle flips with **no flash on reload**, focus rings visible on tab, no console errors.
- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "Design system: tokens, type, nav, footer, buttons, theme toggle"
```

---

### Task 4: Motion foundation — scroll-reveal + interaction polish

**Files:**
- Modify: `assets/js/main.js`, `assets/css/styles.css`

**Interfaces:**
- Consumes: theme JS from Task 3.
- Produces: a reveal behavior applied to any `[data-reveal]` element; a `.is-revealed` class toggled by IntersectionObserver; magnetic/hover polish classes.

- [ ] **Step 1:** CSS: default `[data-reveal]` state (opacity 0, small `translateY`), `.is-revealed` transition to visible — `transform`/`opacity` only. Under `prefers-reduced-motion: reduce`, `[data-reveal]` is fully visible with no transition.
- [ ] **Step 2:** JS: IntersectionObserver adds `.is-revealed` once per element on enter; guard on `matchMedia("(prefers-reduced-motion: reduce)").matches` (skip observing, show immediately). Optional stagger via `--reveal-delay`.
- [ ] **Step 3:** JS: hero living-glow (slow, GPU) and magnetic hover on `.btn--primary`/cards — all disabled under reduced-motion.
- [ ] **Step 4: Verify in browser:** scroll `index.html` — sections reveal smoothly, no layout shift (check with devtools "Layout Shift" / no CLS). Toggle OS reduced-motion → everything appears instantly, no motion. No console errors.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Motion foundation: scroll-reveal + reduced-motion guards"
```

---

### Task 5: Reusable components module

**Files:**
- Create: `_build/partials/components.mjs`
- Test: extend `test/build.test.mjs`

**Interfaces:**
- Consumes: `render.mjs`.
- Produces: `button({label, href, variant})`, `section({id, eyebrow, title, intro, children, ...})`, `statTile({value, label})`, `serviceCard({title, summary, href})`, `projectCard({project, featured})`, `beforeAfter({project, size})`. `beforeAfter` renders the laptop+phone frames with `before`/`after` `<img>` (from `assets/img/shots/${slug}-{before|after}-{desktop|mobile}.jpg`), a range/`aria-pressed` control, and `data-*` hooks for the wipe JS. Cards/sections carry `data-reveal`.

- [ ] **Step 1:** Write `components.mjs` with the functions above. `beforeAfter` must gracefully handle a missing `old`/before image (new builds: show the "after" only, labeled "New build").
- [ ] **Step 2: Write failing tests** in `build.test.mjs` for component output shape:

```js
import { projectCard, beforeAfter, statTile } from "../_build/partials/components.mjs";
import { readFileSync } from "node:fs";
const P = JSON.parse(readFileSync("_build/data/projects.json","utf8"));

test("beforeAfter references the real screenshot paths", () => {
  const p = P.find((x) => x.slug === "princess-purse");
  const out = beforeAfter({ project: p, size: "featured" })[Object.getOwnPropertySymbols(beforeAfter({project:p}))[0]] ?? "";
  const s = String(beforeAfter({ project: p }).__html ?? out);
  assert.match(s, /princess-purse-after-desktop\.jpg/);
  assert.match(s, /princess-purse-before-desktop\.jpg/);
});
```

*(Adjust the accessor to however `raw` exposes its string — simplest: give `raw` a `.toString()` returning the string, and assert on `String(beforeAfter({project:p}))`.)*

- [ ] **Step 3:** Add `toString()` to `raw` objects in `render.mjs` so tests and composition can stringify fragments. Run tests to pass.
- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "Reusable HTML components (cards, sections, before/after, stat tiles)"
```

---

### Task 6: Before/after wipe interaction

**Files:**
- Modify: `assets/js/main.js`, `assets/css/styles.css`

**Interfaces:**
- Consumes: `beforeAfter` markup (`data-beforeafter`, a range input or drag handle, `aria-pressed` toggle).
- Produces: the clip-path wipe: dragging/toggling reveals the "after" over the "before" via `clip-path` on `transform`/`opacity`-friendly layers.

- [ ] **Step 1:** CSS: stack before/after images absolutely; the "after" layer clipped via `--wipe` custom property (`clip-path: inset(0 calc(100% - var(--wipe)) 0 0)`); handle styling; laptop + phone frames.
- [ ] **Step 2:** JS: for each `[data-beforeafter]`, wire pointer drag + a keyboard-accessible range input updating `--wipe`; a simple toggle variant flips `aria-pressed` and snaps between before/after. Respect reduced-motion (snap, no animated transition).
- [ ] **Step 3: Verify in browser** on a page that renders one `beforeAfter` (temporarily on Home or a scratch page): drag reveals old vs new; keyboard works; touch works at 390px. No console errors, no layout shift.
- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "Before/after clip-path wipe (pointer + keyboard, reduced-motion safe)"
```

---

### Task 7: Home page

**Files:**
- Create/replace: `_build/pages/home.mjs`
- Test: extend `test/build.test.mjs`

**Interfaces:**
- Consumes: `components.mjs`, `data/site.json`, `data/projects.json`.
- Produces: `home({site, projects})` → `main` with sections: hero, stat band, "what I do" (4 service cards), featured work (3 featured before/afters), differentiator band, testimonials placeholder (empty/hidden), closing CTA.

- [ ] **Step 1:** Write `home.mjs`. Hero headline verbatim: *"I build websites that convert. And rebuild the ones that don't."* Subhead = rebuild-specialist positioning. CTAs → `work.html` and `contact.html`. Featured = `projects.filter(p => p.featured)` (Princess Purse, Madrona, Component Supply). Differentiator band copy: *"Hand-coded fundamentals. AI-augmented delivery."*
- [ ] **Step 2: Write failing tests:**

```js
test("home hero uses the signature line", () => {
  assert.match(read("index.html"), /rebuild the ones that don.?t/i);
});
test("home shows the 3 featured projects", () => {
  const h = read("index.html");
  for (const slug of ["princess-purse","madrona-recovery","component-supply"])
    assert.match(h, new RegExp(slug));
});
test("home stat band renders 4 stats", () => {
  assert.ok((read("index.html").match(/class="[^"]*stat-tile/g) || []).length >= 4);
});
```

- [ ] **Step 3:** Rebuild, run tests to pass.
- [ ] **Step 4: Verify in browser** at 1440/768/390: hero + glow, stats, service cards reveal, featured before/afters interactive, CTAs link correctly. No console errors, no CLS.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Home page: hero, stats, services teaser, featured work, CTAs"
```

---

### Task 8: Work page — filters + featured tier + grid

**Files:**
- Create/replace: `_build/pages/work.mjs`
- Modify: `assets/js/main.js` (filters)
- Test: extend `test/build.test.mjs`

**Interfaces:**
- Consumes: `components.mjs` (`projectCard`, `beforeAfter`), `data/projects.json`.
- Produces: `work({projects})` → intro, filter buttons (All / Redesign / Cart & Theme Upgrade / New Build), a featured tier (featured projects + one strong cart upgrade — default add `bevel-heaven`), a grid of all 17, and a live counter.

- [ ] **Step 1:** Write `work.mjs`. Filter categories map to project `type`. Each grid card renders a `beforeAfter` (or "new build" single image). Featured tier = `featured:true` ∪ `{bevel-heaven}`. `data-type` on cards for filtering; counter element with `data-count`.
- [ ] **Step 2:** JS filter: clicking a filter shows/hides cards by `data-type` (toggle a class; `transform`/`opacity` only), updates `aria-pressed`, and updates the counter text. Keyboard accessible.
- [ ] **Step 3: Write failing tests:**

```js
test("work page lists all 17 projects", () => {
  const h = read("work.html");
  const P = JSON.parse(readFileSync("_build/data/projects.json","utf8"));
  for (const p of P) assert.match(h, new RegExp(`data-slug="${p.slug}"`), p.slug);
});
test("work page has the 4 filters", () => {
  const h = read("work.html");
  for (const f of ["all","Redesign","Cart","New Build"]) assert.ok(h.includes(f));
});
```

- [ ] **Step 4:** Rebuild, tests pass.
- [ ] **Step 5: Verify in browser:** filters narrow the grid + update the counter; before/after works inside cards; featured tier visually elevated; 390px usable. No console errors.
- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "Work page: filters, featured tier, full 17-project grid + counter"
```

---

### Task 9: Services page

**Files:**
- Create/replace: `_build/pages/services.mjs`
- Test: extend `test/build.test.mjs`

**Interfaces:**
- Consumes: `data/site.json` `services`, `components.mjs`.
- Produces: `services({site})` → intro, 5 detailed service blocks (each: what it is · what you get · who it's for), a "How I work" 5-step band (Audit → Design → Build → QA → Launch), platforms strip, CTA.

- [ ] **Step 1:** Write `services.mjs` from `site.services` (rebuilds lead; new builds; e-commerce/cart upgrades; WordPress care; AI-augmented delivery). Process steps and platforms are real (WP Engine, PinnacleCart, Shopify, WordPress). QA step mentions real practices (pixel-parity, cross-browser).
- [ ] **Step 2: Write failing test:**

```js
test("services page renders all service blocks + process", () => {
  const h = read("services.html");
  const site = JSON.parse(readFileSync("_build/data/site.json","utf8"));
  for (const s of site.services) assert.match(h, new RegExp(s.title.replace(/[.*+?^${}()|[\]\\&]/g,".")));
  for (const step of ["Audit","Design","Build","QA","Launch"]) assert.ok(h.includes(step));
});
```

- [ ] **Step 3:** Rebuild, test passes.
- [ ] **Step 4: Verify in browser** at 3 breakpoints; reveals + CTA work; no console errors.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Services page: 5 offer blocks, process, platforms, CTA"
```

---

### Task 10: About page

**Files:**
- Create/replace: `_build/pages/about.mjs`
- Test: extend `test/build.test.mjs`

**Interfaces:**
- Consumes: `data/cv.json`, portrait, CV PDF.
- Produces: `about({cv})` → portrait + summary/story, skills grid, condensed experience highlights, "why me" values, Download CV button → contact CTA.

- [ ] **Step 1:** Write `about.mjs` from `cv.json` (no invented content). Portrait uses `assets/img/portrait.jpg` (square file). CV button links `assets/cv/Chris_Dave_Magahis_CV.pdf`.
- [ ] **Step 2: Write failing test:**

```js
test("about page renders summary, skills, and CV download", () => {
  const h = read("about.html");
  assert.match(h, /Chris_Dave_Magahis_CV\.pdf/);
  assert.match(h, /portrait\.jpg/);
  const cv = JSON.parse(readFileSync("_build/data/cv.json","utf8"));
  assert.ok(h.includes(cv.summary.slice(0, 30)));
});
```

- [ ] **Step 3:** Rebuild, test passes.
- [ ] **Step 4: Verify in browser:** portrait is a clean circle (square source), skills grid reads well, CV downloads, 3 breakpoints clean.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "About page: story, skills, experience, CV download"
```

---

### Task 11: Contact page + Formspree form

**Files:**
- Create/replace: `_build/pages/contact.mjs`
- Modify: `assets/js/main.js` (form UX), `assets/css/styles.css`
- Test: extend `test/build.test.mjs`

**Interfaces:**
- Consumes: `data/site.json` contact channels.
- Produces: `contact({site})` → a form (`name`, `email`, `project type` select, `message`, hidden honeypot) posting to the Formspree placeholder, plus direct channels, availability + response-time note.

- [ ] **Step 1:** Write `contact.mjs`. Form `action="https://formspree.io/f/REPLACE_ME"` `method="POST"`, honeypot field `_gotcha` visually hidden, required fields with labels, `aria-describedby` for errors. Direct channels from `site.contact` (email mailto, WhatsApp link, Discord handle, GitHub).
- [ ] **Step 2:** JS: client-side validation + async submit via `fetch` to Formspree (Accept: application/json), show inline success/error states without leaving the page; graceful fallback to native submit if JS off.
- [ ] **Step 3: Write failing test:**

```js
test("contact form posts to formspree and has honeypot + channels", () => {
  const h = read("contact.html");
  assert.match(h, /formspree\.io\/f\//);
  assert.match(h, /name="_gotcha"/);
  assert.match(h, /mailto:chriz\.magahis@gmail\.com/);
  assert.match(h, /wa\.me\/639692821388/);
});
```

- [ ] **Step 4:** Rebuild, test passes.
- [ ] **Step 5: Verify in browser:** submitting empty shows validation; the honeypot is hidden; with a real endpoint (if provided) a test submit succeeds and shows the success state; otherwise document that swapping `REPLACE_ME` is the only remaining wiring. 3 breakpoints clean.
- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "Contact page: Formspree form (validation, honeypot, states) + channels"
```

---

### Task 12: Meta, favicon, OG images, README, final QA

**Files:**
- Modify: `_build/partials/head.mjs`, `_build/data/site.json`
- Create: `assets/img/og/og-default.png`, `README.md`
- Test: full suite

**Interfaces:**
- Consumes: everything.
- Produces: per-page `<title>`/description/OG, favicon from monogram, a social preview image, and a README documenting build/serve/deploy + the Formspree swap.

- [ ] **Step 1:** Fill per-page meta/OG in each page's call to `head()`. Favicon: monogram square PNG. Generate one branded `og-default.png` (dark, monogram + tagline) — from the monogram assets, not fabricated content.
- [ ] **Step 2:** Write `README.md`: what it is, `npm run build` / `npm run serve`, how to add a project (edit `projects.json` + drop screenshots + rebuild), how to set the Formspree endpoint, and GitHub Pages deploy steps.
- [ ] **Step 3: Run the full test suite:** `node --test` → all green.
- [ ] **Step 4: Full browser QA** (run/verify flow) across `index/services/work/about/contact` at 1440/768/390: nav, theme toggle (no flash), reveals, before/after, filters, form, all links/assets resolve, no console errors, reduced-motion honored. Run Lighthouse — performance + accessibility in the green; fix regressions.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Meta/OG/favicon, README, final QA pass"
```

---

## Deployment (after plan complete)

1. Create a new GitHub repo (e.g. `cm-web-development`).
2. `git remote add origin <url> && git push -u origin main`.
3. GitHub → Settings → Pages → deploy from `main` / root. `.nojekyll` is present.
4. Swap the Formspree `REPLACE_ME` endpoint for the real one; rebuild; push.
5. (Optional later) point a custom domain; add cookieless GoatCounter to match the existing site.

## Self-Review

- **Spec coverage:** Purpose/positioning → Task 7 hero + copy. 5 pages → Tasks 7–11. Dark+light no-flash → Task 3. Motion/reduced-motion → Tasks 4, 6. Before/after all 17 + featured → Tasks 6, 8. Formspree form → Task 11. Reuse real assets/data → Task 1. Accessibility/perf standards → Tasks 3–12. Build/zero-deps architecture → Tasks 1–2. Deploy/meta/OG → Task 12. No gaps found.
- **Placeholder scan:** No "TBD/TODO". Aesthetic CSS is intentionally criteria-driven (Task 3 delegates palette/spacing polish to ui-ux-pro-max/frontend-design) rather than inventing exact rules up front — token seed values are given concretely in Global Constraints. Formspree `REPLACE_ME` is a documented, intentional placeholder, not a plan gap.
- **Type consistency:** `render.mjs` exports (`esc/attr/html/raw`) used consistently; partial default exports (`head/header/footer`) and component names (`button/section/statTile/serviceCard/projectCard/beforeAfter`) match across Tasks 2, 5, 7–11; `data/*.json` shapes match their consumers.
