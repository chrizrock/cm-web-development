# Chris Dave Magahis — Portfolio Site

A hand-coded, five-page portfolio and services site for a front-end developer &
WordPress specialist: **Home, Services, Work, About, Contact.** Real before-and-after
comparisons across 17 rebuilds, a working Formspree contact form, dark/light
theming, and scroll reveals — no framework, no build-tool magic, no runtime
dependencies.

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
  sliders, Work filters, contact-form enhancement).
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

## ⚠️ Required before deploying: `meta.url`

`_build/data/site.json` → `meta.url` is currently set to an obvious
placeholder:

```json
"url": "https://REPLACE-WITH-YOUR-PAGES-URL"
```

**This must be changed to the site's real deployed URL before going live.**
It's the base every page's `<link rel="canonical">` and Open Graph / Twitter
`url`/`image` tags are built from (see `_build/partials/head.mjs`). Left as the
placeholder, canonical URLs and social-share previews will point at a URL that
doesn't exist.

Internal navigation is unaffected either way — every nav link, button, and
asset reference in the site uses a relative href (`services.html`,
`assets/img/...`), so the site browses and works correctly even before
`meta.url` is set. Only the *absolute* URLs (canonical link, `og:url`,
`og:image`, `twitter:image`) depend on it.

**To fix:** edit `meta.url` in `_build/data/site.json` to your real GitHub
Pages URL (e.g. `https://<username>.github.io/<repo>` for a project page, or
`https://<username>.github.io` for a user/org page), then run
`npm run build` and commit the regenerated HTML.

## Deploying to GitHub Pages

1. Set `meta.url` as described above, then `npm run build` and commit the
   regenerated `.html` files.
2. Push to GitHub:
   ```bash
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
3. In the GitHub repo: **Settings → Pages → Build and deployment → Source:**
   `Deploy from a branch`, **Branch:** `main` / `(root)`.
4. `.nojekyll` is already present at the repo root — this disables Jekyll
   processing so files/folders starting with `_` (like `_build/`) aren't
   swallowed by GitHub's default Jekyll build.
5. Once the Pages URL is live, confirm it matches what you set in `meta.url`
   (step 1) — if it doesn't, update `meta.url`, rebuild, and push again.

### Optional, after launch

- Point a custom domain at the Pages deployment (`CNAME` file + DNS), then
  update `meta.url` to the custom domain and rebuild.
- Add cookieless analytics (e.g. GoatCounter) to match the author's other
  site, if desired.

## Project structure

```
_build/
  build.mjs            # entry point — assembles and writes the 5 HTML files
  lib/render.mjs        # tiny tagged-template HTML renderer (esc/raw/html/attr)
  lib/decode.mjs         # entity-decodes JSON data once at load time
  data/site.json         # site-wide copy: meta, nav, contact, stats, services
  data/projects.json      # the 17 Work-page projects (before/after data)
  data/cv.json             # About-page skills/experience content
  partials/head.mjs        # <head>: meta, OG/Twitter, favicon, font preloads
  partials/header.mjs       # nav bar + theme toggle
  partials/footer.mjs        # footer
  partials/components.mjs     # shared components (section, cards, before/after…)
  pages/*.mjs                  # one module per page (home/services/work/about/contact)
assets/
  css/styles.css                # single stylesheet, dark + light theme tokens
  js/main.js                     # theme toggle, reveals, sliders, filters, form
  fonts/*.woff2                   # self-hosted Space Grotesk + Inter
  img/                              # logo, portrait, project screenshots, OG image
  cv/                                # downloadable CV PDF
test/*.test.mjs                       # node:test suite — run via `npm test`
index.html / services.html / work.html / about.html / contact.html
                                        # GENERATED — do not hand-edit, run `npm run build`
```
