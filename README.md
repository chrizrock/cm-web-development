# CM Web Development

A hand-coded, five-page portfolio and services site for a front-end developer &
WordPress specialist: **Home, Services, Work, About, Contact.** Real
before-and-after comparisons across 17 projects, six services, a working
Formspree contact form, dark/light theming, and scroll reveals — no framework,
no build-tool magic, no runtime dependencies.

**Live:** https://chrizrock.github.io/cm-web-development/

## How it's built

- **Hand-coded, data-generated.** The 5 HTML pages (`index.html`, `services.html`,
  `work.html`, `about.html`, `contact.html`) at the repo root are **generated
  output** — do not hand-edit them. They're assembled by `_build/build.mjs` from:
  - `_build/data/*.json` — the real content (site copy, the 17 projects, the CV).
  - `_build/partials/*.mjs` — the shared `<head>`, header/nav, and footer.
  - `_build/pages/*.mjs` — one module per page, composing shared components
    (`_build/partials/components.mjs`) around each page's real content.
  - `_build/lib/render.mjs` — a small tagged-template HTML renderer
    (escaping, raw-HTML opt-out, attribute helpers) — the only "templating
    engine" here, and it's ~20 lines.
- **Zero runtime dependencies.** The whole build is Node.js built-ins only
  (`node:fs`, `node:path`, `node:http` via `serve` for local dev). Nothing is
  bundled, transpiled, or hydrated client-side. `assets/js/main.js` is a small,
  dependency-free vanilla-JS file (theme toggle, scroll reveals, before/after
  sliders, Work filters, hero build sequence, contact-form enhancement).
- **Self-hosted fonts.** `assets/fonts/*.woff2` (Space Grotesk, Inter) are
  shipped locally and preloaded from `_build/partials/head.mjs` — no Google
  Fonts or other third-party requests at runtime.
- **No external requests.** Fonts, the favicon, the OG/social image, and every
  script/stylesheet are local assets. The only outbound network call the live
  site makes is the contact form's `POST` to Formspree (see below).

## Build & serve

```bash
npm run build   # runs _build/build.mjs — regenerates the 5 HTML files at the repo root
npm run serve   # rebuilds on change (--watch-path=_build) and serves the repo root on :5050
npm test        # node --test — runs the full suite in test/*.test.mjs
```

`npm run build` and `npm test` have no dependencies to install — `npm install`
is not required before either. `npm run serve` shells out to `npx serve` for
the static file server only; nothing else in the toolchain is a dependency.

After any content or template change, **always run `npm run build`** before
committing — the root-level `.html` files must stay in sync with `_build/`.

> **Local-dev gotcha:** `npx serve` issues a `301` from `page.html` to `/page`
> and **drops the query string** doing it. Deep links that carry state use a
> hash (`work.html#type=Redesign`) rather than `?type=` for exactly this
> reason — a fragment survives that redirect where a query does not.

## Adding a project to Work

1. Add before/after screenshots to `assets/img/shots/`, following the existing
   naming convention: `<slug>-after-desktop.jpg`, `<slug>-after-mobile.jpg`,
   and (if the site existed before) `<slug>-before-desktop.jpg` /
   `<slug>-before-mobile.jpg`. New-build projects with no prior site simply
   omit the `before-*` pair.
2. Add an entry to `_build/data/projects.json` with the same shape as the
   existing entries: `slug`, `name`, `kind`, `type` (must be one of `Redesign`,
   `Cart & Theme Upgrade`, `New Build` — these drive the Work-page filters),
   `platform`, `featured` (boolean), `role`, `blurb`, `summary[]`, `tags[]`,
   `live` (the current URL), and `old` (the previous/archived URL, omitted for
   new builds).
3. Run `npm run build` and `npm test` to regenerate the pages and confirm
   `test/data.test.mjs` still passes (it checks every project has its
   after-screenshots present, and that every `old` project has its
   before-screenshots present).

`type` does double duty: the Services page derives its per-service proof
counts from it (currently Redesign 11, Cart & Theme Upgrade 4, New Build 2)
and links each one into a filtered Work page. Those counts are computed at
build time and asserted in `test/build.test.mjs` — a service can never
advertise work that isn't in `projects.json`.

## Adding a service

Add an entry to `_build/data/site.json` → `services[]` (`id`, `title`,
`summary`, `forWho`, `bullets[]`), then add its `id` to `SERVICE_ORDER` in
`_build/pages/services.mjs` — **the page renders from that array, not from the
JSON order**, so a service missing from it is silently dropped. The "Service NN
of NN" counters and the closing CTA derive from the list length, so nothing
else needs renumbering.

To give the service a proof line, map its `id` to a project `type` in
`SERVICE_WORK_TYPE` in the same file. Services with no matching projects are
left without a proof line deliberately — never give one a type it has no real
work for.

## Contact form (Formspree)

The Contact page form posts directly to a Formspree endpoint, set in
`_build/pages/contact.mjs`:

```js
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mnjepezn";
```

To point the form at a different Formspree form, change that constant to your
own endpoint (`https://formspree.io/f/<your-form-id>`) and rebuild
(`npm run build`). The form degrades gracefully — it's a plain
`<form method="POST" action="...">` that works with JavaScript disabled
(Formspree's own hosted "thank you" page takes over); `assets/js/main.js`
progressively enhances it with inline validation and an async submit.

## Deployment

Deployed to GitHub Pages from `main` / `(root)` at
**https://chrizrock.github.io/cm-web-development/**.

`.nojekyll` is present at the repo root so files and folders starting with `_`
(like `_build/`) aren't swallowed by GitHub's default Jekyll build.

### If the URL ever changes

`_build/data/site.json` → `meta.url` is the base every page's
`<link rel="canonical">` and Open Graph / Twitter `url`/`image` tags are built
from (see `_build/partials/head.mjs`). It is currently:

```json
"url": "https://chrizrock.github.io/cm-web-development"
```

Moving the site (a custom domain, a user/org Pages site, a rename) means
editing that value, running `npm run build`, and committing the regenerated
HTML — otherwise canonical URLs and social-share previews keep pointing at the
old address.

Internal navigation is unaffected either way: every nav link, button, and asset
reference uses a relative href (`services.html`, `assets/img/...`), so the site
browses correctly from any base path. Only the *absolute* URLs depend on
`meta.url`.

## Analytics (GoatCounter)

Cookieless, ~3KB, loaded `async` so it never blocks first paint — no cookies,
no personal data, no consent banner. Emitted from
`_build/partials/head.mjs`, driven by one value in `_build/data/site.json`:

```json
"goatcounter": "cm-webdevelopment"
```

That's the site **code**, not a URL — it becomes
`https://<code>.goatcounter.com/count`. Set it to `""` or delete the key and
no script is emitted at all, so analytics can be switched off without touching
a partial.

Stats: https://cm-webdevelopment.goatcounter.com

Two things worth knowing:

- **Don't reuse another site's code.** GoatCounter buckets hits by **path**,
  not hostname. This site and the author's CV site both have `index.html` and
  `work.html`, so pointing both at one code would merge those into single rows
  that mean nothing for either. Each site gets its own code (add one under
  Settings → Sites in the same GoatCounter account).
- **Local dev isn't counted.** `count.js` skips `localhost` and private IP
  ranges by itself, so `npm run serve` on `:5050` never reaches the stats.

## Conventions worth knowing

A few rules the tests enforce, so they're not accidentally undone:

- **Nothing fabricated.** Copy, counts, and credentials come from
  `_build/data/*.json`. The hero's code/render panes use a fictional
  placeholder ("Atlas Bistro") rather than implying a real client, and both
  panes must agree — every text node in the code pane has to appear in the
  rendered pane beside it.
- **One `<h1>` per page.** The hero's render pane imitates a heading and a
  button with styled `<span>`s precisely so it doesn't introduce a second
  `<h1>` or a stray `<button>`.
- **The header must never wrap.** It's a fixed-height sticky band, so a wrapped
  second row renders *outside* it over the page content. The desktop nav gives
  way to the hamburger below **960px**, which is the width the full header
  actually needs. That breakpoint lives in two places — a media query in
  `assets/css/styles.css` and `MOBILE_NAV_MAX` in `assets/js/main.js` — and a
  test asserts they agree.
- **Motion plays once.** Sequences run on entry and settle; nothing loops
  perpetually. Everything is gated behind `prefers-reduced-motion:
  no-preference`, and the default (no-JS, reduced-motion) state is always the
  finished composition rather than an empty frame.

## Project structure

```
_build/
  build.mjs            # entry point — assembles and writes the 5 HTML files
  lib/render.mjs        # tiny tagged-template HTML renderer (esc/raw/html/attr)
  lib/decode.mjs         # entity-decodes JSON data once at load time
  data/site.json         # site-wide copy: meta, nav, contact, stats, services
  data/projects.json      # the 17 Work-page projects (before/after data)
  data/cv.json             # About-page skills/experience content
  data/process.mjs          # the shared 5-step process (Services page)
  partials/head.mjs          # <head>: meta, OG/Twitter, favicon, font preloads
  partials/header.mjs         # nav bar + theme toggle
  partials/footer.mjs          # footer
  partials/components.mjs       # shared components (section, cards, before/after…)
  pages/*.mjs                    # one module per page (home/services/work/about/contact)
assets/
  css/styles.css                  # single stylesheet, dark + light theme tokens
  js/main.js                       # theme toggle, reveals, sliders, filters, form
  fonts/*.woff2                     # self-hosted Space Grotesk + Inter
  img/                                # logo, project screenshots, OG image
  cv/                                  # downloadable CV PDF
test/*.test.mjs                         # node:test suite — run via `npm test`
index.html / services.html / work.html / about.html / contact.html
                                          # GENERATED — do not hand-edit, run `npm run build`
```
