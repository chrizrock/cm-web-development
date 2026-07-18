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
  const hero = html`<section class="section section--anchor hero" data-reveal>
  <div class="container hero-inner">
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
