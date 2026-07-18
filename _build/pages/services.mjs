// Services page (Task 9) — the sales page. Composes: an intro/hero framing
// the rebuild-specialist positioning, 5 detailed service blocks rendered
// straight from site.json.services (rebuilds leads, matching the order
// Home already deep-links to: #rebuilds #new-builds #ecommerce
// #wordpress-care, plus #ai-delivery), a 5-step "How I work" process band,
// a real-platforms strip, and a closing CTA. Receives ALREADY
// entity-decoded data ({ site, projects } — see the data note in
// components.mjs); copy here is grounded in site.json/cv.json facts,
// nothing fabricated.
import { html } from "../lib/render.mjs";
import { section, button } from "../partials/components.mjs";
// The 5-step process is shared with the Home hero pipeline — single source of
// truth in data/process.mjs so the two surfaces can never drift.
import { PROCESS_STEPS } from "../data/process.mjs";

// Render order — rebuilds leads per the brief; matches every deep link
// Home already points at (services.html#<id>).
const SERVICE_ORDER = ["rebuilds", "new-builds", "ecommerce", "wordpress-care", "ai-delivery"];

// Real platforms he works in day to day (cv.json / site.json — not a
// generic tech-stack list).
const PLATFORMS = [
  { name: "WordPress", note: "Block themes, Elementor, Divi" },
  { name: "PinnacleCart", note: "Storefronts & theme upgrades" },
  { name: "Shopify", note: "End-to-end store builds" },
  { name: "WP Engine", note: "Hosting, migrations, uptime" },
];

/**
 * serviceBlock({ service, index }) -> one anchored, alternating two-column
 * detail section: eyebrow/title/summary/forWho on one side, the bullets[]
 * as a checkmark list on the other. `id="<service-id>"` is the anchor Home's
 * #rebuilds/#new-builds/#ecommerce/#wordpress-care/#ai-delivery links land
 * on; `scroll-margin-top` (styles.css) keeps the sticky header from
 * covering the heading on arrival.
 */
function serviceBlock({ service, index }) {
  const { id, title, summary, forWho, bullets } = service;
  const num = String(index + 1).padStart(2, "0");
  const bulletItems = bullets.map((b) => html`<li>${b}</li>`);

  return html`<section id="${id}" class="section service-block" data-reveal>
  <div class="container service-block-inner">
    <div class="service-block-lead">
      <p class="eyebrow">Service ${num} of 05</p>
      <h2 class="service-block-title">${title}</h2>
      <p class="service-block-summary measure">${summary}</p>
      <p class="service-block-forwho"><strong>Who it's for —</strong> ${forWho}</p>
    </div>
    <div class="service-block-detail">
      <p class="service-block-detail-label">What you get</p>
      <ul class="check-list">${bulletItems}</ul>
    </div>
  </div>
</section>`;
}

export default function services({ site }) {
  const { services: allServices } = site;
  const orderedServices = SERVICE_ORDER.map((id) => allServices.find((s) => s.id === id)).filter(Boolean);

  // -- 1. INTRO/HERO ----------------------------------------------------------
  const intro = html`<section class="section section--anchor services-intro" data-reveal>
  <div class="container services-intro-inner">
    <p class="eyebrow">${site.meta.siteName} &middot; Services</p>
    <h1 class="services-intro-title">Mostly rebuilds. Sometimes from scratch.</h1>
    <p class="services-intro-lede measure">
      Most of what lands on this page is a rebuild &mdash; the site is live,
      it's just not pulling its weight anymore. The same hand-coded
      fundamentals cover a new build from nothing, a cart or theme
      migration, ongoing WordPress care, or an AI-augmented pipeline when
      speed matters as much as precision. Five services, one standard: real
      hierarchy, honest performance, and nothing shipped that hasn't been
      checked against the design pixel for pixel.
    </p>
  </div>
</section>`;

  // -- 2. FIVE SERVICE BLOCKS ---------------------------------------------
  const serviceBlocks = orderedServices.map((service, index) => serviceBlock({ service, index }));

  // -- 3. HOW I WORK: PROCESS BAND -----------------------------------------
  const processSteps = PROCESS_STEPS.map(
    (step, i) => html`<li class="process-step">
  <span class="process-step-num" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>
  <h3 class="process-step-name">${step.name}</h3>
  <p class="process-step-copy">${step.copy}</p>
</li>`
  );

  const processBand = section({
    id: "how-i-work",
    eyebrow: "How I work",
    title: "Five steps, every project.",
    intro: "The same process whether it's a full rebuild, a new build, or a same-day WordPress fix.",
    reveal: true,
    children: html`<ol class="process-band">${processSteps}</ol>`,
  });

  // -- 4. PLATFORMS STRIP ----------------------------------------------------
  const platformItems = PLATFORMS.map(
    (p) => html`<li class="platform-item">
  <span class="platform-name">${p.name}</span>
  <span class="platform-note">${p.note}</span>
</li>`
  );

  const platformsStrip = section({
    id: "platforms",
    eyebrow: "Where I build",
    title: "Real platforms, not a generic stack.",
    reveal: true,
    children: html`<ul class="platform-strip">${platformItems}</ul>`,
  });

  // -- 5. CLOSING CTA ---------------------------------------------------------
  const closingCta = html`<section class="section cta-section" data-reveal>
  <div class="container">
    <div class="cta-panel">
      <p class="eyebrow">Start here</p>
      <h2 class="cta-title">Not sure which one you need?</h2>
      <p class="cta-copy">
        Send the site (or the idea) and I'll tell you which of these five
        it actually is &mdash; and what I'd do first.
      </p>
      <div class="cta-actions">
        ${button({ label: "Start a project", href: "contact.html", variant: "primary" })}
        ${button({ label: "See the work", href: "work.html", variant: "ghost" })}
      </div>
    </div>
  </div>
</section>`;

  return html`${intro}${serviceBlocks}${processBand}${platformsStrip}${closingCta}`;
}
