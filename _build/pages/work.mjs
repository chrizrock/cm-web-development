// Work page (Task 8) — the portfolio showcase. Composes section()/
// projectCard()/beforeAfter() from components.mjs into: an intro, a
// featured tier (the 3 featured:true projects + bevel-heaven, shown larger),
// a filter bar with a live counter, and the full 17-project grid. Receives
// ALREADY entity-decoded data ({ site, projects }, see the data note in
// components.mjs); copy here is grounded in projects.json and matches the
// home page's (home.mjs) tone — nothing fabricated.
import { html } from "../lib/render.mjs";
import { section, projectCard } from "../partials/components.mjs";

// Filter categories map 1:1 onto the real `type` values in projects.json
// ("Redesign" | "Cart & Theme Upgrade" | "New Build"). "all" isn't a real
// type — it's the reset state assets/js/main.js's filter JS recognizes.
const FILTERS = [
  { type: "all", label: "All" },
  { type: "Redesign", label: "Redesigns" },
  { type: "Cart & Theme Upgrade", label: "Cart & Theme Upgrades" },
  { type: "New Build", label: "New Builds" },
];

// Featured tier = the 3 projects flagged featured:true in projects.json
// (princess-purse, madrona-recovery, component-supply) plus bevel-heaven —
// a cart-and-theme upgrade strong enough to sit alongside the full
// redesigns, so the tier isn't all one kind of work.
const FEATURED_SLUGS = new Set([
  "princess-purse",
  "madrona-recovery",
  "component-supply",
  "bevel-heaven",
]);

export default function work({ projects }) {
  const total = projects.length;

  // -- 1. INTRO -----------------------------------------------------------
  const intro = html`<section class="section section--anchor work-intro" data-reveal>
  <div class="container work-intro-inner">
    <p class="eyebrow">Work &middot; ${total} projects</p>
    <h1 class="work-intro-title">Real before &amp; afters, not mockups.</h1>
    <p class="work-intro-lede measure">
      Every comparison below is a real screenshot &mdash; the site as it runs
      today against the site that was there before, pulled from the live URL
      or, where the original's gone, the Internet Archive. Full redesigns,
      cart-and-theme upgrades, and a couple of builds that started from
      nothing. Filter by the kind of work, or drag any slider yourself.
    </p>
  </div>
</section>`;

  // -- 2. FEATURED TIER -----------------------------------------------------
  const featuredProjects = projects.filter((p) => FEATURED_SLUGS.has(p.slug));
  const featuredCards = featuredProjects.map((project) => projectCard({ project, featured: true }));

  const featuredTier = section({
    id: "featured",
    eyebrow: "Featured",
    title: "Four of the seventeen, up close.",
    intro:
      "Three full redesigns and the cart-and-theme migration that best shows what a re-platform under a live store looks like — shown larger, because these are the ones worth lingering on.",
    reveal: true,
    children: html`<div class="featured-work work-featured-grid">${featuredCards}</div>`,
  });

  // -- 3. FILTER BAR + FULL GRID --------------------------------------------
  const filterBar = html`<div class="work-filter-bar" data-work-filters role="group" aria-label="Filter projects by type">
    <div class="work-filter-buttons">
      ${FILTERS.map(
        (f, i) =>
          html`<button type="button" class="work-filter-btn" data-filter="${f.type}" aria-pressed="${
            i === 0 ? "true" : "false"
          }">${f.label}</button>`
      )}
    </div>
    <p class="work-filter-count" data-count>Showing ${total} of ${total}</p>
  </div>`;

  const gridCards = projects.map((project) => projectCard({ project }));

  const allWork = section({
    id: "all-work",
    eyebrow: `All ${total} projects`,
    title: "Every rebuild, upgrade, and new build.",
    intro:
      "The same 17, as one list. Each card carries its own slider — drag it, or use the toggle if you'd rather snap between before and after.",
    // reveal:false on the SECTION wrapper only — at ~17 stacked cards this
    // section is far taller than any viewport, and main.js's
    // IntersectionObserver uses threshold:0.15 (15% of the TARGET's own
    // area must be visible). For a target this tall, the visible fraction
    // never reaches 15% at any scroll position (visible-ratio caps at
    // viewport-height / section-height), so a data-reveal on the whole
    // section would never fire and would leave the entire grid stuck at
    // opacity:0. Each projectCard() still carries its own (much shorter,
    // reveal-safe) data-reveal, so the per-card fade-in is unaffected.
    reveal: false,
    children: html`${filterBar}
    <div class="work-grid" data-work-grid>${gridCards}</div>`,
  });

  return html`${intro}${featuredTier}${allWork}`;
}
