// About page (Task 10; rev3 revised) — the human + the credibility.
// Composes: an intro/hero (the real cv.json summary + a hand-coded
// editor/terminal motif in place of a portrait photo), a grouped skills
// grid, a reframed "background" band (capability + geography, no past
// employer names), a "why me" values band grounded in real cv.json facts,
// and a closing CTA. Receives ALREADY entity-decoded data ({ site, cv } —
// see the data note in components.mjs). Every fact here comes straight
// from cv.json; nothing is fabricated.
import { html } from "../lib/render.mjs";
import { section, button } from "../partials/components.mjs";

// The code/terminal motif that replaces the portrait: a small, real snippet
// quoting this very design system (the --radius-lg and --fs-md tokens from
// assets/css/styles.css, verbatim) plus a semantic HTML fragment in the
// site's own voice. Decorative only — marked aria-hidden below — so it adds
// nothing to the accessibility tree and nothing fabricated to the page.
const codeMotif = html`<div class="about-code-wrap">
  <div class="code-motif" aria-hidden="true">
    <div class="code-motif-bar">
      <span class="code-motif-dot"></span>
      <span class="code-motif-dot"></span>
      <span class="code-motif-dot"></span>
      <span class="code-motif-file">~/cm-web-development/about.html</span>
    </div>
    <pre class="code-motif-body"><code><span class="cm-comment">/* hand-coded. zero dependencies. */</span>
<span class="cm-tag">:root</span> {
  <span class="cm-prop">--radius-lg</span>: <span class="cm-string">16px</span>;
  <span class="cm-prop">--fs-md</span>: <span class="cm-fn">clamp</span>(<span class="cm-string">1.05rem</span>, 0.99rem + 0.3vw, <span class="cm-string">1.25rem</span>);
}

<span class="cm-punct">&lt;</span><span class="cm-tag">section</span> <span class="cm-attr">class</span>=<span class="cm-string">"about-intro"</span><span class="cm-punct">&gt;</span>
  <span class="cm-punct">&lt;</span><span class="cm-tag">h1</span><span class="cm-punct">&gt;</span>Built by hand.<span class="cm-punct">&lt;/</span><span class="cm-tag">h1</span><span class="cm-punct">&gt;</span>
<span class="cm-punct">&lt;/</span><span class="cm-tag">section</span><span class="cm-punct">&gt;</span><span class="code-motif-caret"></span></code></pre>
  </div>
</div>`;

// Reframed "background" band (owner feedback, rev3): capability + geography
// breadth without naming any past employer — a résumé reads off-message on
// a studio site. Each chapter is a faithful, de-identified summary of one or
// more real cv.json experience/earlierExperience entries: the years and
// location come straight from those records, and the line of copy restates
// the entry's own highlight/description text (business-type words like
// "travel agency" or "consultancy" are already how those entries describe
// the client, not invented labels) with the employer name itself removed.
// Nothing here is a client, employer, or fact that isn't already in
// cv.json.
const BACKGROUND = [
  {
    years: "2004 – 2015",
    region: "UAE",
    line: "Web and graphic design for travel and local businesses in Sharjah and Dubai — 15+ hand-coded hotel-booking sites, CMS builds on WordPress and Joomla, corporate branding, and email/SEO campaigns.",
  },
  {
    years: "2015 – 2022",
    region: "Dubai, UAE",
    line: "Ran a consultancy's website end to end — design, hosting, cross-browser testing — plus corporate identity systems, marketing collateral, and CRM administration.",
  },
  {
    years: "2019 – 2021",
    region: "Remote · Freelance",
    line: "Designed and built a Shopify storefront for an apparel brand — catalog, hosting, domains, email, and Facebook Shops integration.",
  },
  {
    years: "2022 – Present",
    region: "Colorado, USA · Remote",
    line: "Re-themed e-commerce storefronts on a major cart platform, then moved in-house managing an agency's client WordPress portfolio and building the AI-augmented, QA-gated delivery system behind this studio.",
  },
];

// One value prop per card — each grounded in a real cv.json fact (the
// summary, the skills groups, or the Thunderbolt Group subHighlights on
// AI-delivery QA gates), nothing invented.
const VALUES = [
  {
    title: "Hand-coded, zero dependencies",
    copy: "Semantic, responsive HTML/CSS written by hand — no page-builder bloat, no framework overhead riding along for the ride.",
  },
  {
    title: "Two decades, three countries",
    copy: "20+ years building for e-commerce, agency, and consultancy clients across the Philippines, the UAE, and the US.",
  },
  {
    title: "AI-augmented, still verified",
    copy: "A multi-agent AI system speeds up analysis, design, and builds — but every AI-generated build ships behind deterministic QA gates, including pixel-diff visual parity checked per breakpoint.",
  },
  {
    title: "Accessible by default",
    copy: "Responsive, cross-browser, accessible design isn't bolted on afterward — it's part of the front-end skill set from the first line of markup.",
  },
];

/**
 * backgroundItem({ years, region, line }) -> one de-identified background
 * chapter (years, region, one line of capability copy — no employer name).
 * Reuses the .experience-item* classes from the original timeline; the
 * years take the "role" heading slot and the region takes the "org" slot.
 */
function backgroundItem({ years, region, line }) {
  return html`<li class="experience-item" data-reveal>
  <div class="experience-item-head">
    <h3 class="experience-item-role">${years}</h3>
    <span class="experience-item-org">${region}</span>
  </div>
  <p class="experience-item-line">${line}</p>
</li>`;
}

export default function about({ site, cv }) {
  const { summary, skills } = cv;

  // -- 1. INTRO/HERO: summary + code/terminal motif --------------------------
  const intro = html`<section class="section section--anchor about-intro" data-reveal>
  <div class="container about-intro-inner">
    <div class="about-intro-copy">
      <p class="eyebrow">${site.meta.siteName} &middot; About</p>
      <h1 class="about-intro-title">Front-end developer. WordPress specialist. AI-augmented builder.</h1>
      <p class="about-intro-summary measure">${summary}</p>
      <div class="about-intro-actions">
        ${button({ label: "See the work", href: "work.html", variant: "ghost" })}
      </div>
    </div>
    ${codeMotif}
  </div>
</section>`;

  // -- 2. SKILLS GRID ---------------------------------------------------------
  const skillGroups = skills.map(
    (group) => html`<div class="card skill-group" data-reveal>
  <h3 class="skill-group-title">${group.group}</h3>
  <ul class="skill-group-items">${group.items.map((item) => html`<li>${item}</li>`)}</ul>
</div>`
  );

  const skillsSection = section({
    id: "skills",
    eyebrow: "What I bring",
    title: "Skills, grouped the way I actually use them.",
    intro:
      "Front-end craft and WordPress operations, the AI tooling that speeds both up, and the design and marketing skills that come from running the whole job end to end.",
    reveal: true,
    children: html`<div class="skills-grid">${skillGroups}</div>`,
  });

  // -- 3. BACKGROUND (rev3 reframe) --------------------------------------------
  // Capability + geography breadth, no past employer names — see the
  // BACKGROUND comment above for how each chapter maps back to real
  // cv.json experience/earlierExperience entries.
  const backgroundItems = BACKGROUND.map((chapter) => backgroundItem(chapter));

  const backgroundSection = section({
    id: "background",
    eyebrow: "How I got here",
    title: "20+ years, condensed.",
    intro:
      "Small-business and consultancy web work in the UAE, a freelance e-commerce build, then platform and in-house agency WordPress work in the US — the kinds of projects, not the résumé.",
    reveal: true,
    children: html`<ol class="experience-timeline">${backgroundItems}</ol>`,
  });

  // -- 4. WHY ME: VALUES --------------------------------------------------------
  const valueCards = VALUES.map(
    (v) => html`<div class="card value-card" data-reveal>
  <h3 class="value-card-title">${v.title}</h3>
  <p class="value-card-copy">${v.copy}</p>
</div>`
  );

  const valuesSection = section({
    id: "why-me",
    eyebrow: "Why me",
    title: "What two decades actually buys you.",
    reveal: true,
    children: html`<div class="values-grid">${valueCards}</div>`,
  });

  // -- 5. CLOSING CTA -----------------------------------------------------------
  const closingCta = html`<section class="section cta-section" data-reveal>
  <div class="container">
    <div class="cta-panel">
      <p class="eyebrow">Start here</p>
      <h2 class="cta-title">Want to work together?</h2>
      <p class="cta-copy">
        Tell me about the site — live or not built yet — and I'll tell you
        what I'd do first.
      </p>
      <div class="cta-actions">
        ${button({ label: "Start a project", href: "contact.html", variant: "primary" })}
        ${button({ label: "See the work", href: "work.html", variant: "ghost" })}
      </div>
    </div>
  </div>
</section>`;

  return html`${intro}${skillsSection}${backgroundSection}${valuesSection}${closingCta}`;
}
