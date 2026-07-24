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
import { section, statTile, serviceCard, projectCard, button, firstSentence } from "../partials/components.mjs";

export default function home({ site, projects }) {
  const { stats, services } = site;

  // -- 1. HERO ----------------------------------------------------------------
  // Whole-section anchor: carries the signature glow (styles.css .section--anchor)
  // and the page's single <h1>. The second sentence is wrapped as one contiguous
  // span so the teal marker underline lands on the rebuild thesis without
  // splitting the phrase.
  //
  // The hero is a two-column composition: the thesis/CTAs on the left, and the
  // flagship visual on the right — the code, beside what it renders.
  //
  // This replaced an earlier before/after collage. The collage was about
  // REDESIGN (dated layout becomes modern layout) while the headline beside it
  // makes a claim about CONVERSION and about hand-writing the markup — so the
  // picture was answering a question the sentence hadn't asked. Two panes of
  // real code and its real output put the visual and the words back in
  // agreement.
  //
  // Responsive by construction: mobile-first the two panes are a SAFE vertical
  // stack (code above, render below — the order you'd actually work in) that
  // cannot overflow; the side-by-side split is a wider-viewport enhancement
  // (see styles.css). The centered scroll cue stays a full-width row beneath
  // both columns.
  // The hero visual: THE CODE, AND WHAT IT RENDERS.
  //
  // Two panes — hand-written semantic markup on the left, the browser's
  // rendering of that exact markup on the right. The snippet is real, valid
  // HTML and the render pane mirrors it element for element (heading →
  // paragraph → call-to-action), so the picture demonstrates the claim instead
  // of illustrating it. That claim is the one differentiator here: these sites
  // are hand-written, not assembled in a page builder.
  //
  // The snippet is deliberately GENERIC (a table booking). It makes no claim
  // about any real client, quotes no metric, and nothing in it is fabricated —
  // same rule the rest of this file follows.
  //
  // Accessibility: the cluster is one labelled image (role="img" + a single
  // honest aria-label) with both panes aria-hidden beneath it. Every label in
  // the render pane is a <span>, never a heading, so the page keeps its single
  // <h1> and a sane heading order.

  // Syntax tokens, hand-rolled. Deliberately no highlighter dependency —
  // "Zero frameworks" is on this hero's own meta list, so shipping a library
  // to colour six lines of HTML would undercut the sentence beside it.
  const openTag = (name, attrs = []) =>
    html`<span class="tok-p">&lt;</span><span class="tok-t">${name}</span>${attrs.map(
      ([k, v]) =>
        html` <span class="tok-a">${k}</span><span class="tok-p">=</span><span class="tok-s">"${v}"</span>`
    )}<span class="tok-p">&gt;</span>`;
  const closeTag = (name) =>
    html`<span class="tok-p">&lt;/</span><span class="tok-t">${name}</span><span class="tok-p">&gt;</span>`;
  const codeText = (s) => html`<span class="tok-x">${s}</span>`;

  // Indent is a CLASS, never literal whitespace: template-literal indentation
  // would otherwise leak into the output and shift every line.
  //
  // Each line also carries its own index as --i, so the typing delay is one
  // calc() in the stylesheet instead of seventeen nth-child rules that would
  // need renumbering every time a line is added or removed.
  // Depth ships as --d and the stylesheet multiplies it, rather than a
  // cl--i1/cl--i2/cl--i3 ladder — one missing rung in that ladder silently
  // dumps a line flush against the gutter, which is exactly what happened
  // when the nav pushed the document to depth 3.
  const cl = (depth, ...parts) => [depth, parts];
  const codeLine = ([depth, parts], i) =>
    html`<span class="cl" style="--i:${i};--d:${depth}">${parts}</span>`;

  // A WHOLE PAGE, header to footer — not a fragment. Every text node here has
  // to appear in the render pane beside it (build.test.mjs enforces that), so
  // the two panes can never drift into claiming something untrue.
  //
  // "Atlas Bistro" is a fictional placeholder, same rule the wireframe mockups
  // followed before it: no real client, no real screenshot, nothing traceable.
  const codeLines = [
    cl(0, openTag("body")),
    cl(1, openTag("header")),
    cl(2, openTag("a", [["class", "logo"]]), codeText("Atlas"), closeTag("a")),
    cl(2, openTag("nav")),
    cl(3, openTag("a", [["href", "/menu"]]), codeText("Menu"), closeTag("a")),
    cl(3, openTag("a", [["href", "/hours"]]), codeText("Hours"), closeTag("a")),
    cl(2, closeTag("nav")),
    cl(1, closeTag("header")),
    cl(1, openTag("main")),
    cl(2, openTag("h1"), codeText("Book a table"), closeTag("h1")),
    cl(2, openTag("p"), codeText("Open until 11 tonight."), closeTag("p")),
    cl(2, openTag("a", [["class", "cta"]]), codeText("Reserve"), closeTag("a")),
    cl(1, closeTag("main")),
    cl(1, openTag("footer"), codeText("© Atlas Bistro"), closeTag("footer")),
    cl(0, closeTag("body")),
  ].map(codeLine);

  const paneBar = (label) => html`<span class="pane-bar">
      <span class="flow-dots"><i></i><i></i><i></i></span>
      <span class="pane-label">${label}</span>
    </span>`;

  const flow = html`<aside class="hero-build" role="img" aria-label="A complete hand-written HTML document — header, nav, main and footer — beside the finished site it renders: a nav bar, a heading reading Book a table, a Reserve button, and a footer.">
    <div class="hero-build-stage">
      <div class="build-pane build-pane--code" aria-hidden="true">
        ${paneBar("index.html")}
        <div class="code-block">${codeLines}<span class="code-caret"></span></div>
      </div>

      <div class="build-pane build-pane--render" aria-hidden="true">
        ${paneBar("atlasbistro.test")}
        <div class="render-body">
          <span class="rs-header rp-el">
            <span class="rs-logo">Atlas</span>
            <span class="rs-nav"><span>Menu</span><span>Hours</span></span>
          </span>
          <span class="rs-main">
            <span class="rp-el rp-title">Book a table</span>
            <span class="rp-el rp-text">Open until 11 tonight.</span>
            <span class="rp-el rp-cta">Reserve</span>
          </span>
          <span class="rs-footer rp-el">© Atlas Bistro</span>
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
  // A curated subset, not all six: the AI service is covered by the
  // differentiator band below, and app/product work is deliberately held back
  // to the Services page until there's app work in the portfolio to point at.
  // Teaser = the first real sentence of each service summary.
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
