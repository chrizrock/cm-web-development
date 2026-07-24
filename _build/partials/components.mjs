// Reusable HTML fragments (Task 5) — the single source of markup the 5 page
// templates (Tasks 7-11) compose from. Every export returns a raw() fragment
// from the `html` tagged template, so callers can nest them freely and
// stringify the result with String(fragment) (see render.mjs's raw().toString()
// and the serialize() export).
//
// Data note: callers must pass ALREADY entity-decoded data (decodeData() in
// decode.mjs, applied once at data-load time — see build.mjs / header.mjs /
// footer.mjs for the pattern). Components never call decodeData themselves;
// they just esc()/html() the values through normally. Passing raw
// (still-encoded) JSON straight from projects.json would double-escape
// ("Oxman &amp; Oxman" -> "Oxman &amp;amp; Oxman").
import { html, raw, attr } from "../lib/render.mjs";

// Real intrinsic dimensions of the screenshot set (assets/img/shots/*.jpg) —
// used as width/height so the image reserves its box before it decodes
// (prevents layout shift). Verified against the actual JPEGs, not invented.
const SHOT = {
  desktop: { w: 2880, h: 1800 },
  mobile: { w: 780, h: 1688 },
};

const shotPath = (slug, phase, breakpoint) => `assets/img/shots/${slug}-${phase}-${breakpoint}.jpg`;

/**
 * firstSentence(s) -> the first real sentence of a string, used verbatim as a
 * teaser. TRUNCATION of real copy, never a paraphrase — so a teaser can't
 * drift from the summary it came from. Falls back to the whole string when
 * there's no sentence break. Shared by Home's service cards and the Services
 * page index so both teasers are derived the same way.
 */
export const firstSentence = (s) => {
  const m = String(s).match(/^.*?\.(?=\s|$)/);
  return m ? m[0] : s;
};

/**
 * button({ label, href, variant }) -> <a class="btn btn--{variant}">
 * variant: "primary" (default) | "ghost"
 */
export function button({ label, href, variant = "primary", className = "" }) {
  const classes = ["btn", `btn--${variant}`, className].filter(Boolean).join(" ");
  return html`<a class="${classes}" href="${href}">${label}</a>`;
}

/**
 * section({ id, eyebrow, title, intro, children, anchor, tag, className, reveal })
 * Generic section wrapper used across all 5 page templates: .section >
 * .container > optional eyebrow/h2/intro, then the caller's children.
 * - anchor: adds .section--anchor (the teal->violet glow treatment) for
 *   hero/anchor-style sections.
 * - tag: heading tag for the title (default "h2").
 * - reveal: set false to opt a section out of scroll-reveal (default true).
 */
export function section({
  id,
  eyebrow,
  title,
  intro,
  children,
  anchor = false,
  tag = "h2",
  className = "",
  reveal = true,
}) {
  const classes = ["section", anchor ? "section--anchor" : "", className].filter(Boolean).join(" ");
  const attrs = attr({ id, "data-reveal": reveal ? true : undefined });
  return html`<section class="${classes}"${raw(attrs)}>
  <div class="container">
    ${eyebrow ? html`<p class="eyebrow">${eyebrow}</p>` : ""}
    ${title ? html`<${raw(tag)} class="section-title">${title}</${raw(tag)}>` : ""}
    ${intro ? html`<p class="section-intro measure">${intro}</p>` : ""}
    ${children}
  </div>
</section>`;
}

/**
 * statTile({ value, label }) -> a single stat in the stat band.
 */
export function statTile({ value, label }) {
  return html`<div class="card stat-tile" data-reveal>
  <span class="stat-tile-value">${value}</span>
  <span class="stat-tile-label">${label}</span>
</div>`;
}

/**
 * serviceCard({ title, summary, href }) -> a link-card teaser for one
 * service.json entry, used on the home page's "what I do" band.
 */
export function serviceCard({ title, summary, href }) {
  return html`<a class="card service-card" href="${href}" data-reveal>
  <h3 class="service-card-title">${title}</h3>
  <p class="service-card-summary">${summary}</p>
  <span class="service-card-cta" aria-hidden="true">Learn more &rarr;</span>
</a>`;
}

/**
 * projectCard({ project, featured }) -> a card in the work grid / featured
 * tier. Carries data-slug + data-type so Task 8's filter JS can show/hide by
 * project type, and embeds beforeAfter() for the visual comparison.
 */
export function projectCard({ project, featured = false }) {
  const { slug, name, kind, type, blurb, tags = [], live } = project;
  const classes = ["project-card", featured ? "project-card--featured" : ""].filter(Boolean).join(" ");
  const tagList = tags.map((t) => html`<li>${t}</li>`);

  return html`<article class="${classes}" data-reveal data-slug="${slug}" data-type="${type}">
  ${beforeAfter({ project, size: featured ? "featured" : "grid" })}
  <div class="project-card-body">
    <p class="project-card-kind">${kind}</p>
    <h3 class="project-card-name">${name}</h3>
    <p class="project-card-blurb">${blurb}</p>
    <ul class="project-card-tags">${tagList}</ul>
    <a class="project-card-link" href="${live}" target="_blank" rel="noopener noreferrer">
      Visit live site <span aria-hidden="true">&#8599;</span>
    </a>
  </div>
</article>`;
}

/**
 * beforeAfter({ project, size }) -> the laptop+phone comparison frame.
 * size: "grid" (default, work-grid card) | "featured" (larger, home/featured
 * tier).
 *
 * Projects WITHOUT an `old` site (new builds — e.g. 7-day-drapes,
 * component-supply-blog) have no before screenshot to compare against: this
 * renders the "after" image only, labeled "New build", and skips the wipe
 * control entirely (no data-beforeafter, no range, no toggle) — there's
 * nothing to wipe. Task 6 wires the pointer/keyboard interaction onto the
 * data-* hooks below; this module only produces the markup.
 */
export function beforeAfter({ project, size = "grid" }) {
  const { slug, name } = project;
  const hasBefore = Boolean(project.old);
  const sizeClass = ` before-after--${size}`;

  if (!hasBefore) {
    return html`<div class="before-after before-after--new${sizeClass}" data-beforeafter-static>
  <span class="before-after-badge">New build</span>
  <div class="before-after-frame before-after-frame--desktop">
    <img class="before-after-img" src="${shotPath(slug, "after", "desktop")}"
      alt="${name} — new build" loading="lazy" width="${SHOT.desktop.w}" height="${SHOT.desktop.h}" />
  </div>
  <div class="before-after-frame before-after-frame--mobile">
    <img class="before-after-img" src="${shotPath(slug, "after", "mobile")}"
      alt="${name} — new build, mobile view" loading="lazy" width="${SHOT.mobile.w}" height="${SHOT.mobile.h}" />
  </div>
</div>`;
  }

  const uid = `beforeafter-${slug}-${size}`;

  return html`<div class="before-after${sizeClass}" data-beforeafter style="--wipe: 50cqi">
  <div class="before-after-frame before-after-frame--desktop">
    <img class="before-after-img before-after-img--before" src="${shotPath(slug, "before", "desktop")}"
      alt="${name} — before" loading="lazy" width="${SHOT.desktop.w}" height="${SHOT.desktop.h}" />
    <img class="before-after-img before-after-img--after" data-beforeafter-after src="${shotPath(slug, "after", "desktop")}"
      alt="${name} — after, redesigned" loading="lazy" width="${SHOT.desktop.w}" height="${SHOT.desktop.h}" />
  </div>
  <div class="before-after-frame before-after-frame--mobile">
    <img class="before-after-img before-after-img--before" src="${shotPath(slug, "before", "mobile")}"
      alt="${name} — before, mobile view" loading="lazy" width="${SHOT.mobile.w}" height="${SHOT.mobile.h}" />
    <img class="before-after-img before-after-img--after" data-beforeafter-after src="${shotPath(slug, "after", "mobile")}"
      alt="${name} — after, mobile view" loading="lazy" width="${SHOT.mobile.w}" height="${SHOT.mobile.h}" />
  </div>
  <div class="before-after-controls">
    <label class="before-after-range-label" for="${uid}">
      <span class="sr-only">Drag to compare before and after for ${name}</span>
      <input type="range" id="${uid}" class="before-after-range" min="0" max="100" value="50"
        data-beforeafter-range aria-label="Before and after comparison slider for ${name}" />
    </label>
    <button type="button" class="before-after-toggle" data-beforeafter-toggle
      aria-pressed="false" aria-label="Toggle before and after view for ${name}">
      <span aria-hidden="true">Before / After</span>
    </button>
  </div>
</div>`;
}
