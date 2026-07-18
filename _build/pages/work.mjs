// Work page (Task 8) — the portfolio showcase. Composes section()/
// projectCard()/beforeAfter() from components.mjs into: an intro, a
// featured tier (ONE project, randomly re-picked client-side on every load —
// see assets/js/main.js's initWorkFeaturedRandom(); the server renders a
// sensible default here so a no-JS visitor still sees one), a filter bar
// with a live counter, and the full 17-project grid. Receives ALREADY
// entity-decoded data ({ site, projects }, see the data note in
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

export default function work({ site, projects }) {
  const total = projects.length;

  // -- 1. INTRO -----------------------------------------------------------
  const intro = html`<section class="section section--anchor work-intro" data-reveal>
  <div class="container work-intro-inner">
    <p class="eyebrow">${site.meta.siteName} &middot; Work</p>
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
  // Exactly ONE featured project, shown larger. Server-rendered default is
  // the first project flagged featured:true in projects.json (a sensible,
  // deterministic pick for a no-JS visitor); assets/js/main.js's
  // initWorkFeaturedRandom() replaces this slot's content with a randomly
  // chosen project (cloned + re-sized from the full grid below, its wipe
  // re-wired) on every page load, so the pool is genuinely all 17.
  const defaultFeatured = projects.find((p) => p.featured) || projects[0];
  const featuredCard = projectCard({ project: defaultFeatured, featured: true });

  const featuredTier = section({
    id: "featured",
    eyebrow: "Featured",
    title: "One of the seventeen — a different one each visit.",
    intro:
      "Picked at random from all 17 projects on load, so reloading this page shows a different rebuild, upgrade, or new build shown larger. Drag its slider like any other.",
    reveal: true,
    children: html`<div class="featured-work work-featured-grid" data-work-featured>${featuredCard}</div>`,
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
