// About page (Task 10) — the human + the credibility. Composes: an
// intro/hero (portrait + the real cv.json summary + a Download CV button),
// a grouped skills grid, a condensed experience timeline, a "why me" values
// band grounded in real cv.json facts, and a closing CTA. Receives ALREADY
// entity-decoded data ({ site, cv } — see the data note in components.mjs).
// Every fact here comes straight from cv.json; nothing is fabricated.
import { html } from "../lib/render.mjs";
import { section, button } from "../partials/components.mjs";

// Real intrinsic dimensions of assets/img/portrait.jpg — a genuinely square
// source file (560x560), verified against the actual JPEG bytes. Rendered
// as a circle via border-radius:50% on a box whose width AND height are
// set to the same fixed value in CSS (not aspect-ratio), so older in-app
// WebViews that lack aspect-ratio support still get a clean circle, never
// an egg.
const PORTRAIT = { w: 560, h: 560 };

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
 * experienceItem({ role, company, tag, dates, line }) -> one condensed
 * timeline entry (role, org, timeframe, one line — not the full CV).
 */
function experienceItem({ role, company, tag, dates, line }) {
  return html`<li class="experience-item" data-reveal>
  <div class="experience-item-head">
    <h3 class="experience-item-role">${role}</h3>
    <span class="experience-item-org">${company}${tag ? ` ${tag}` : ""}</span>
  </div>
  <p class="experience-item-dates">${dates}</p>
  <p class="experience-item-line">${line}</p>
</li>`;
}

export default function about({ site, cv }) {
  const { name, summary, skills, experience, earlierExperience } = cv;

  // -- 1. INTRO/HERO: portrait + summary + CV download ----------------------
  const intro = html`<section class="section section--anchor about-intro" data-reveal>
  <div class="container about-intro-inner">
    <div class="about-intro-copy">
      <p class="eyebrow">${site.meta.siteName} &middot; About</p>
      <h1 class="about-intro-title">Front-end developer. WordPress specialist. AI-augmented builder.</h1>
      <p class="about-intro-summary measure">${summary}</p>
      <div class="about-intro-actions">
        <a class="btn btn--primary" href="assets/cv/Chris_Dave_Magahis_CV.pdf" download="Chris_Dave_Magahis_CV.pdf">
          Download CV
        </a>
        ${button({ label: "See the work", href: "work.html", variant: "ghost" })}
      </div>
    </div>
    <div class="about-portrait-wrap">
      <div class="about-portrait-ring">
        <div class="about-portrait-frame">
          <img class="about-portrait-img" src="assets/img/portrait.jpg" alt="${name}"
            width="${PORTRAIT.w}" height="${PORTRAIT.h}" loading="eager" />
        </div>
      </div>
    </div>
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

  // -- 3. EXPERIENCE TIMELINE --------------------------------------------------
  // Condensed: role, org, timeframe, one line — the full CV (Download CV
  // above) covers the rest. Order matches cv.json (most recent first).
  const roleItems = experience.map((role) =>
    experienceItem({
      role: role.role,
      company: role.company,
      tag: role.tag,
      dates: role.dates,
      line: role.highlights[0],
    })
  );

  const earlierItems = (earlierExperience || []).map((role) =>
    experienceItem({
      role: role.role,
      company: role.company,
      dates: role.dates,
      line: role.line,
    })
  );

  const experienceSection = section({
    id: "experience",
    eyebrow: "Where I've worked",
    title: "20+ years, condensed.",
    intro:
      "An in-house AI/WordPress role now, e-commerce platform work before that, and a decade of agency and freelance builds before that.",
    reveal: true,
    children: html`<ol class="experience-timeline">${roleItems}${earlierItems}</ol>`,
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

  return html`${intro}${skillsSection}${experienceSection}${valuesSection}${closingCta}`;
}
