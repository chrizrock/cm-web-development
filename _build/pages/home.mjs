// Home page (Task 7) — the flagship. Composes the shared components into an
// editorial, left-aligned dark-premium layout: hero (the "rebuild specialist"
// thesis + teal→violet glow), a stat band, a "what I do" teaser, the three
// featured before/after rebuilds, an AI-augmented differentiator band, a
// reserved (empty) testimonials slot, and a closing CTA.
//
// Receives ALREADY entity-decoded data from build.mjs ({ site, projects }) —
// see the data note in components.mjs. All copy is real (site.json / cv.json /
// projects.json); nothing here is fabricated.
import { html, raw } from "../lib/render.mjs";
import { section, statTile, serviceCard, projectCard, button } from "../partials/components.mjs";
// The real 5-step process — shared with the Services "Five steps, every
// project" band (single source of truth) so the hero pipeline below can never
// drift from it. See data/process.mjs.
import { PROCESS_STEPS } from "../data/process.mjs";

// First real sentence of a service summary, used verbatim as a card teaser
// (truncation of real copy — never a paraphrase). Falls back to the whole
// string if there's no sentence break.
const firstSentence = (s) => {
  const m = String(s).match(/^.*?\.(?=\s|$)/);
  return m ? m[0] : s;
};

export default function home({ site, projects }) {
  const { stats, services } = site;

  // -- 1. HERO ----------------------------------------------------------------
  // Whole-section anchor: carries the signature glow (styles.css .section--anchor)
  // and the page's single <h1>. The second sentence is wrapped as one contiguous
  // span so the teal marker underline lands on the rebuild thesis without
  // splitting the phrase.
  //
  // The hero is a two-column composition: the thesis/CTAs on the left, and the
  // flagship visual on the right — a FLOATING FLOW COLLAGE that tells the
  // rebuild story dimensionally. A real dated screenshot ("Before") in a tilted
  // browser card flows — along dotted SVG connectors with arrowheads — past the
  // studio's real process as floating chips (Audit / Design / Build / QA, from
  // data/process.mjs, the single source of truth), to the rebuilt "After" card
  // (elevated), and finally to the glowing teal "Launched" endpoint — the
  // payoff. Purely presentational: the whole cluster is one labelled image to
  // assistive tech (role="img" + one honest aria-label), the connector SVG is
  // aria-hidden, and every label is a <span> (never a heading) so the page
  // keeps its single <h1> and a sane heading order.
  //
  // Composition is DEPTH-FIRST: cards at a few degrees of rotation, layered
  // z-order, soft shadows, and the accented Launched card carrying the ONLY
  // glow (the hero's section-anchor atmosphere is the sole ambient glow — they
  // never compete). Real assets only: princess-purse before/after screenshots
  // and the real step names — nothing fabricated.
  //
  // Responsive by construction: the markup is mobile-first a SAFE vertical
  // stack (Before → chips → After → Launched, in real narrative order) that
  // cannot overflow; the absolute floating collage is a >=900px enhancement
  // layered on top (see styles.css). The centered scroll cue stays a full-width
  // row beneath both columns.
  const CHIP_ICON = { Audit: "✓", Design: "", Build: "</>", QA: "✓" };
  const chipSteps = PROCESS_STEPS.slice(0, 4); // Audit, Design, Build, QA

  // The Before/After cards are GENERIC, self-contained wireframe mockups drawn
  // in HTML/CSS — abstract "fake browser window" UIs, not screenshots of any
  // real site (zero external requests; nothing traceable to a client). The flow
  // is illustrative — "a dated site, rebuilt and launched" — not a showcase.
  // `body` is decorative wireframe markup (blocks only, no text). The whole
  // card is aria-hidden below the aside's single accessible label.
  const flowWindow = ({ variant, tag, body }) => html`<div class="flow-window flow-window--${variant}" aria-hidden="true">
    <span class="flow-window-bar">
      <span class="flow-dots"><i></i><i></i><i></i></span>
      <span class="flow-url"></span>
    </span>
    <span class="flow-tag flow-tag--${variant}">${tag}</span>
    <div class="mock mock--${variant}">${body}</div>
  </div>`;

  // Before: a cluttered, dated generic layout — a cramped multi-row header,
  // mismatched blocks, muted greyscale, tight spacing.
  const beforeMock = html`<span class="mk-strip"></span>
    <span class="mk-head mk-head--b">
      <span class="mk-logo"></span>
      <span class="mk-navb"></span><span class="mk-navb"></span><span class="mk-navb"></span><span class="mk-navb"></span>
    </span>
    <span class="mk-banner"></span>
    <span class="mk-mess"><span></span><span></span><span></span></span>`;

  // After: a clean, modern generic layout — single tidy header, a clear hero
  // block with an on-brand accent, a neat equal grid, generous spacing.
  const afterMock = html`<span class="mk-head mk-head--a">
      <span class="mk-logo mk-logo--a"></span>
      <span class="mk-nav"></span><span class="mk-nav"></span><span class="mk-nav"></span>
      <span class="mk-cta"></span>
    </span>
    <span class="mk-hero">
      <span class="mk-hero-line"></span>
      <span class="mk-hero-line mk-hero-line--sm"></span>
      <span class="mk-hero-btn"></span>
    </span>
    <span class="mk-grid"><span></span><span></span><span></span></span>`;

  const flow = html`<aside class="hero-flow" role="img" aria-label="A dated site, rebuilt through my five-step process and launched live.">
    <div class="hero-flow-stage">
      <svg class="hero-flow-links" viewBox="0 0 100 116" preserveAspectRatio="xMidYMid meet" fill="none" aria-hidden="true">
        <defs>
          <marker id="flowArrow" markerWidth="3.4" markerHeight="3.4" refX="2.7" refY="1.6" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0.4 0.4 L3 1.6 L0.4 2.8 Z" fill="currentColor" stroke="none" />
          </marker>
        </defs>
        <path class="hero-flow-link" d="M35 37 C 41 44, 40 45, 43 46" marker-end="url(#flowArrow)" />
        <path class="hero-flow-link" d="M71 78 C 64 84, 50 82, 50 86" marker-end="url(#flowArrow)" />
      </svg>

      <figure class="flow-item flow-item--before">
        <div class="flow-float">
          ${flowWindow({ variant: "before", tag: "Before", body: beforeMock })}
        </div>
      </figure>

      ${chipSteps.map((step, i) => {
        const icon = CHIP_ICON[step.name];
        return html`<span class="flow-chip flow-chip--${i}">
        <span class="flow-chip-label">${step.name}</span>${icon
          ? html`<span class="flow-chip-icon" aria-hidden="true">${icon}</span>`
          : ""}
      </span>`;
      })}

      <figure class="flow-item flow-item--after">
        <div class="flow-float">
          ${flowWindow({ variant: "after", tag: "After", body: afterMock })}
        </div>
      </figure>

      <div class="flow-item flow-item--launch">
        <div class="flow-float">
          <div class="flow-launch">
            <span class="flow-launch-icon" aria-hidden="true">&#128640;</span>
            <span class="flow-launch-text">
              <span class="flow-launch-title">Launched</span>
              <span class="flow-launch-sub">Live in production</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </aside>`;

  const hero = html`<section class="section section--anchor hero" data-reveal>
  <div class="container hero-inner">
    <div class="hero-columns">
      <div class="hero-content">
        <p class="eyebrow">${site.meta.siteName} &middot; Rebuild specialist</p>
        <h1 class="hero-title">
          <span class="hero-title-line">I build websites that convert.</span>
          <span class="hero-title-line hero-title-mark">And rebuild the ones that don't.</span>
        </h1>
        <p class="hero-lede">
          Most of what I do is rebuilds &mdash; taking a dated, cluttered, or
          barely-usable site and rebuilding it around real hierarchy, the content
          that's already there, and a layout that finally works on a phone.
          Hand-coded, 20+ years in, across WordPress, PinnacleCart, and plain
          HTML/CSS.
        </p>
        <div class="hero-cta">
          ${button({ label: "See the before & after", href: "work.html", variant: "primary" })}
          ${button({ label: "Start a project", href: "contact.html", variant: "ghost" })}
        </div>
        <ul class="hero-meta">
          <li>Hand-coded</li>
          <li>Zero frameworks</li>
          <li>WordPress &middot; PinnacleCart &middot; HTML/CSS</li>
        </ul>
      </div>
      ${flow}
    </div>
    <a class="hero-scroll" href="#work" aria-label="Scroll to see the work">
      <span>Scroll</span>
      <span class="hero-scroll-line" aria-hidden="true"></span>
    </a>
  </div>
</section>`;

  // -- 2. STAT BAND -----------------------------------------------------------
  const statBand = section({
    className: "stat-section",
    reveal: true,
    children: html`<div class="stat-band">${stats.map(statTile)}</div>`,
  });

  // -- 3. WHAT I DO -----------------------------------------------------------
  // Four of the five services (the AI service is covered by the differentiator
  // band below). Teaser = the first real sentence of each service summary.
  const serviceOrder = ["rebuilds", "new-builds", "ecommerce", "wordpress-care"];
  const serviceCards = serviceOrder
    .map((id) => services.find((s) => s.id === id))
    .filter(Boolean)
    .map((s) =>
      serviceCard({
        title: s.title,
        summary: firstSentence(s.summary),
        href: `services.html#${s.id}`,
      })
    );

  const whatIDo = section({
    id: "services",
    eyebrow: "What I do",
    title: "Four ways I get a site working.",
    intro:
      "Most engagements start as a rebuild. But whether the site exists yet or not, the job is the same: real hierarchy, honest performance, and a storefront or homepage that earns its keep.",
    reveal: true,
    children: html`<div class="service-grid">${serviceCards}</div>
    <a class="section-more" href="services.html">See all services <span aria-hidden="true">&rarr;</span></a>`,
  });

  // -- 4. FEATURED WORK -------------------------------------------------------
  const featured = projects.filter((p) => p.featured);
  const featuredCards = featured.map((project) => projectCard({ project, featured: true }));

  const featuredWork = section({
    id: "work",
    eyebrow: "Featured work",
    title: "Drag to see what changed.",
    intro:
      "Three rebuilds, side by side. On the left is the site that was there; on the right is what I shipped. Same business, same brand — a storefront that finally sells.",
    reveal: true,
    children: html`<div class="featured-work">${featuredCards}</div>
    <a class="section-more" href="work.html">See all 17 projects <span aria-hidden="true">&rarr;</span></a>`,
  });

  // -- 5. DIFFERENTIATOR BAND -------------------------------------------------
  // Craft thesis on the left; a real, verifiable spec list for the "Devy"
  // AI system on the right (figures from cv.json / site.json ai-delivery).
  const differentiator = html`<section class="section differentiator" data-reveal>
  <div class="container differentiator-inner">
    <div class="differentiator-lead">
      <p class="eyebrow">The way I build</p>
      <h2 class="section-title">Hand-coded fundamentals. AI-augmented delivery.</h2>
      <p class="differentiator-copy">
        Two decades of hand-coding semantic HTML and CSS &mdash; no page-builder
        bloat, no framework overhead. Paired with <strong>&ldquo;Devy,&rdquo;</strong>
        a multi-agent AI development system I built on Claude Code that
        orchestrates specialist agents from intake to deployed build, with
        deterministic QA gates so AI-generated work is verified, not just
        trusted.
      </p>
    </div>
    <dl class="differentiator-specs">
      <div class="spec">
        <dt class="spec-value">8+ agents</dt>
        <dd class="spec-label">Scraping, design, WordPress &amp; React builds, QA &mdash; orchestrated from intake to deploy.</dd>
      </div>
      <div class="spec">
        <dt class="spec-value">&ge;98% parity</dt>
        <dd class="spec-label">Pixel-diff visual gate, verified per breakpoint before anything ships.</dd>
      </div>
      <div class="spec">
        <dt class="spec-value">20+ years</dt>
        <dd class="spec-label">Hand-coded HTML/CSS across e-commerce, agency, and consultancy work.</dd>
      </div>
    </dl>
  </div>
</section>`;

  // -- 6. TESTIMONIALS (reserved) --------------------------------------------
  // Intentionally renders nothing visible: no testimonials have been supplied
  // and none will be fabricated. Slot kept as a marker for a future task.
  const testimonials = raw(
    "\n<!-- Testimonials: reserved slot. Intentionally empty — no testimonials supplied, none fabricated. -->\n"
  );

  // -- 7. CLOSING CTA ---------------------------------------------------------
  const closingCta = html`<section class="section cta-section" data-reveal>
  <div class="container">
    <div class="cta-panel">
      <p class="eyebrow">Start here</p>
      <h2 class="cta-title">Have a site that should be doing more?</h2>
      <p class="cta-copy">
        Tell me what's not working. I'll tell you what I'd rebuild &mdash; and
        show you the before &amp; after of jobs just like it.
      </p>
      <div class="cta-actions">
        ${button({ label: "Start a project", href: "contact.html", variant: "primary" })}
        ${button({ label: "See the work", href: "work.html", variant: "ghost" })}
      </div>
    </div>
  </div>
</section>`;

  return html`${hero}${statBand}${whatIDo}${featuredWork}${differentiator}${testimonials}${closingCta}`;
}
