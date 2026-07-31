import { test, before } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { esc } from "../_build/lib/render.mjs";
import { decodeEntities, decodeData } from "../_build/lib/decode.mjs";

before(() => execSync("node _build/build.mjs"));
const read = (f) => readFileSync(f, "utf8");
const PAGES = ["index.html", "services.html", "work.html", "about.html", "contact.html"];

test("all 5 pages generated with a shell", () => {
  for (const f of PAGES) {
    const h = read(f);
    assert.match(h, /<!doctype html>/i, `${f} doctype`);
    assert.match(h, /id="main"/, `${f} main landmark`);
    assert.match(h, /class="[^"]*skip[^"]*"/i, `${f} skip link`);
  }
});

// The header swaps the desktop nav for the hamburger below a breakpoint that
// lives in TWO places — a media query in styles.css and MOBILE_NAV_MAX in
// main.js. They were 720px while the desktop header actually needs ~956px to
// fit on one line, so every width from 721-955px rendered the desktop header
// with nowhere to put it: the CTA and theme toggle wrapped to a second row and
// hung outside the fixed-height sticky band, over the page content.
test("mobile-nav breakpoint agrees between styles.css and main.js, and clears the header's real width", () => {
  const css = read("assets/css/styles.css");
  const js = read("assets/js/main.js");

  const cssBp = css.match(/@media \(max-width: (\d+)px\) \{\s*\.site-nav \{ display: none; \}/);
  assert.ok(cssBp, "found the mobile-nav media query in styles.css");

  const jsBp = js.match(/const MOBILE_NAV_MAX = (\d+);/);
  assert.ok(jsBp, "found MOBILE_NAV_MAX in main.js");

  assert.equal(
    cssBp[1],
    jsBp[1],
    `breakpoint drift: styles.css says ${cssBp[1]}px, main.js says ${jsBp[1]}px`
  );

  // Measured content width of the full desktop header at the switchover.
  // Below this the desktop header cannot fit on one line.
  assert.ok(
    Number(cssBp[1]) >= 955,
    `breakpoint ${cssBp[1]}px is below the ~956px the desktop header needs — the 721-955px wrap bug`
  );

  // The band is fixed-height and sticky, so a wrapped row escapes it entirely.
  assert.match(css, /\.header-inner \{[^}]*flex-wrap: nowrap;/s, "header must not be allowed to wrap");
});

test("header + footer identical across pages (no drift)", () => {
  const grab = (h, tag) => h.match(new RegExp(`<${tag}[\\s\\S]*?</${tag}>`))[0];
  const norm = (s) => s.replace(/aria-current="page"/g, "");
  const headers = PAGES.map((f) => norm(grab(read(f), "header")));
  const footers = PAGES.map((f) => grab(read(f), "footer"));
  assert.ok(headers.every((h) => h === headers[0]), "headers differ beyond active state");
  assert.ok(footers.every((h) => h === footers[0]), "footers differ");
});

// rev4 Change B: the "cm" monogram gets a "Web Development" wordmark next
// to it in BOTH the header and footer lockups, completing the CM Web
// Development brand. Real text (not an image), and part of the home link
// in both places.
test("header + footer both show the 'Web Development' wordmark next to the monogram, as a home link", () => {
  for (const f of PAGES) {
    const h = read(f);
    const header = h.match(/<header[\s\S]*?<\/header>/)[0];
    const footer = h.match(/<footer[\s\S]*?<\/footer>/)[0];
    assert.match(header, /<a class="logo"[^>]*aria-label="CM Web Development home"[^>]*>[\s\S]*?<span class="logo-wordmark"[^>]*>Web Development<\/span><\/a>/, `${f} header wordmark`);
    assert.match(footer, /<a class="logo logo--footer"[^>]*aria-label="CM Web Development home"[^>]*>[\s\S]*?<span class="logo-wordmark"[^>]*>Web Development<\/span><\/a>/, `${f} footer wordmark`);
  }
});

test("active nav marked per page", () => {
  assert.match(
    read("services.html"),
    /aria-current="page"[^>]*>\s*Services|Services[\s\S]{0,40}aria-current="page"/
  );
});

// --- Home page (Task 7) --------------------------------------------------

test("home hero uses the signature line", () => {
  assert.match(read("index.html"), /rebuild the ones that don.?t/i);
});

// rev9: the hero's right column is an ILLUSTRATED TWO-MONITOR SCENE — a big
// monitor showing the real hand-written code, and a smaller monitor showing the
// site it renders (a landing page: hero image, heading, a card row).
test("home hero renders the two-monitor scene (code + rendered site)", () => {
  const h = read("index.html");
  const start = h.indexOf('class="hero-build"');
  assert.ok(start > -1, "hero-build present in the hero");
  const build = h.slice(start, h.indexOf("</aside>", start));

  // Two framed monitors with stands.
  assert.match(build, /class="device device--code"/, "code monitor");
  assert.match(build, /class="device device--render"/, "result monitor");
  assert.match(build, /class="device-frame"/, "monitor bezel");
  assert.equal((build.match(/class="device-stand"/g) || []).length, 2, "both monitors have a stand");

  // Big monitor still shows the REAL whole-document code, header to footer —
  // hand-rolled tokens, no highlighter dependency (Zero frameworks).
  assert.match(build, /class="tok-a">class/, "attribute token");
  for (const tag of ["body", "header", "nav", "main", "footer"]) {
    assert.match(build, new RegExp(`class="tok-t">${tag}<`), `<${tag}> in the code`);
  }

  // Result monitor shows the landing page: a hero image block, a heading, and a
  // three-card row.
  assert.match(build, /class="site-hero rp-el"/, "rendered hero block");
  assert.match(build, /class="site-head rp-el"/, "rendered heading");
  assert.equal((build.match(/class="site-card rp-el"/g) || []).length, 3, "a three-card row");

  // Pure CSS/HTML/inline-SVG — no external image requests, nothing traceable to
  // a real client.
  assert.ok(!/<img/.test(build), "no <img> — the scene is pure CSS/HTML/SVG");
});

// The scene is decorative beneath the aside's single aria-label, so it must
// never introduce a second <h1> or a real <button> — the page owns exactly one
// <h1>, in the hero heading.
test("home still has exactly one h1, and the hero scene uses no heading/button elements", () => {
  const h = read("index.html");
  assert.equal((h.match(/<h1[\s>]/g) || []).length, 1);
  const start = h.indexOf('class="hero-build"');
  const build = h.slice(start, h.indexOf("</aside>", start));
  assert.ok(!/<h1[\s>]|<h2[\s>]|<button[\s>]/.test(build), "no real heading/button elements in the scene");
});

test("home shows the 3 featured projects", () => {
  const h = read("index.html");
  for (const slug of ["princess-purse", "madrona-recovery", "component-supply"])
    assert.match(h, new RegExp(`data-slug="${slug}"`));
});

test("home stat band renders 4 stats", () => {
  assert.ok((read("index.html").match(/class="[^"]*stat-tile\b/g) || []).length >= 4);
});

test("home stat band's project-count stat reads 'Projects shown', not 'Rebuilds shown'", () => {
  const h = read("index.html");
  assert.match(h, /Projects shown/);
  assert.doesNotMatch(h, /Rebuilds shown/);
});

// The 'Services' stat must equal the real number of services, or it lies.
test("home stat band's 'Services' count matches site.services", () => {
  const site = JSON.parse(readFileSync("_build/data/site.json", "utf8"));
  const stat = site.stats.find((s) => s.label === "Services");
  assert.ok(stat, "a Services stat exists");
  assert.equal(String(site.services.length), stat.value, "Services stat matches the real service count");
});

// --- Rebrand: "CM Web Development" chrome (rev2 Change 1) -------------------
// The studio brand replaces the personal name in page-hero eyebrows, <title>,
// og:site_name, and og/twitter titles across all 5 pages. The About page's
// bio/summary text stays personal (its wording already carries no proper
// name). As of rev3, the portrait photo, its alt text, and the CV download
// (and its filename) are removed entirely — see the About page tests below.

test("every page-hero eyebrow reads 'CM Web Development · <Page>'", () => {
  const expectations = [
    ["index.html", "CM Web Development &middot; Rebuild specialist"],
    ["services.html", "CM Web Development &middot; Services"],
    ["work.html", "CM Web Development &middot; Work"],
    ["about.html", "CM Web Development &middot; About"],
    ["contact.html", "CM Web Development &middot; Contact"],
  ];
  for (const [file, text] of expectations) {
    assert.ok(read(file).includes(`<p class="eyebrow">${text}</p>`), `${file} eyebrow`);
  }
});

test("site brand in <title>/og:site_name/og:title/twitter:title is CM Web Development on every page", () => {
  for (const f of PAGES) {
    const h = read(f);
    assert.match(h, /<title>[^<]*CM Web Development[^<]*<\/title>/, `${f} <title>`);
    assert.match(h, /<meta property="og:site_name" content="CM Web Development">/, `${f} og:site_name`);
    assert.match(h, /<meta property="og:title" content="[^"]*CM Web Development[^"]*">/, `${f} og:title`);
    assert.match(h, /<meta name="twitter:title" content="[^"]*CM Web Development[^"]*">/, `${f} twitter:title`);
  }
});

test("About page (rev3): no portrait photo and no CV download button", () => {
  const h = read("about.html");
  assert.doesNotMatch(h, /Chris_Dave_Magahis_CV\.pdf/);
  assert.doesNotMatch(h, /<img[^>]*portrait\.jpg/);
  assert.doesNotMatch(h, /Download CV/);
});

// --- Entity-decode: pre-encoded HTML entities in source JSON must decode
// ONCE at data-load time, so downstream esc()/html() output a single
// &amp; (which the browser displays as "&"), never a double-escaped
// &amp;amp;. See _build/lib/decode.mjs and the cross-task decision in
// .superpowers/sdd/progress.md.

test("decodeEntities: known pre-encoded value decodes to the literal character", () => {
  assert.equal(decodeEntities("Oxman &amp; Oxman"), "Oxman & Oxman");
});

test("decodeEntities -> esc() round trip produces a single &amp;, never &amp;amp;", () => {
  const decoded = decodeEntities("Oxman &amp; Oxman");
  const rendered = esc(decoded);
  assert.equal(rendered, "Oxman &amp; Oxman");
  assert.ok(!rendered.includes("&amp;amp;"), "must not double-escape");
});

test("decodeData recursively decodes real projects.json data (oxman-and-oxman)", () => {
  const projects = decodeData(JSON.parse(readFileSync("_build/data/projects.json", "utf8")));
  const oxman = projects.find((p) => p.slug === "oxman-and-oxman");
  assert.ok(oxman, "oxman-and-oxman project present");
  assert.equal(oxman.name, "Oxman & Oxman");
  assert.equal(esc(oxman.name), "Oxman &amp; Oxman");
});

// --- Work page (Task 8) ---------------------------------------------------

test("work page lists all 17 projects", () => {
  const h = read("work.html");
  const P = JSON.parse(readFileSync("_build/data/projects.json", "utf8"));
  for (const p of P) assert.match(h, new RegExp(`data-slug="${p.slug}"`), p.slug);
});

test("work page has the 4 filters", () => {
  const h = read("work.html");
  for (const f of ["all", "Redesign", "Cart", "New Build"]) assert.ok(h.includes(f), f);
});

test("work page has a live counter", () => {
  const h = read("work.html");
  assert.match(h, /data-count/);
  assert.match(h, /Showing 17 of 17/);
});

// Featured tier now shows exactly ONE project, server-rendered as a sensible
// default (the first featured:true project) — assets/js/main.js swaps it for
// a client-side random pick from all 17 on load (rev2 Change 2). The full
// 17-project grid below is unchanged and still contains every slug,
// including the ones formerly hardcoded into the featured tier.
test("work page featured tier server-renders exactly one default featured project", () => {
  const h = read("work.html");
  const start = h.indexOf('id="featured"');
  const end = h.indexOf('id="all-work"');
  assert.ok(start > -1 && end > start, "featured section renders before the all-work section");
  const featuredHtml = h.slice(start, end);
  const featuredCardMatches = featuredHtml.match(/class="project-card project-card--featured"/g) || [];
  assert.equal(featuredCardMatches.length, 1, "exactly one server-rendered featured project card");
  assert.match(featuredHtml, /data-work-featured/, "featured slot carries the JS hook");
  assert.match(featuredHtml, /data-slug="princess-purse"/, "default featured pick is the first featured:true project");
  assert.match(featuredHtml, /Featured/);
});

test("work page full grid still contains every formerly-hardcoded featured slug", () => {
  const h = read("work.html");
  for (const slug of ["princess-purse", "madrona-recovery", "component-supply", "bevel-heaven"])
    assert.match(h, new RegExp(`data-slug="${slug}"`), slug);
});

test("main.js wires a client-side random featured pick, guarded to the work page", () => {
  const js = read("assets/js/main.js");
  assert.match(js, /data-work-featured/, "guards on the work page's featured slot");
  assert.match(js, /Math\.random/, "picks randomly");
  assert.match(js, /wireBeforeAfterWidget/, "wires the wipe on the cloned featured pick");
});

// rev4 Change A: the featured slot is now a full-width showcase panel
// (.work-featured-grid), not a narrow card -- assert the slot markup that
// makes that CSS possible is present, and that the CSS itself styles
// .work-featured-grid as its own scoped panel (never touching Home's
// unrelated, same-classed .featured-work featured tier).
test("work page featured slot renders inside the full-width showcase wrapper", () => {
  const h = read("work.html");
  assert.match(h, /<div class="featured-work work-featured-grid" data-work-featured>/, "featured slot carries the showcase wrapper class");
});

test("styles.css scopes the full-width showcase panel to .work-featured-grid, not the bare .featured-work Home reuses", () => {
  const css = read("assets/css/styles.css");
  assert.match(css, /\.work-featured-grid\s*\{[^}]*background:\s*var\(--surface\)/, "showcase panel styling present");
  assert.match(css, /\.work-featured-grid \.project-card--featured\s*\{[^}]*flex-direction:\s*column/, "featured card forced to a full-width stacked layout");
});

// --- Services page (Task 9) ------------------------------------------------

test("services page renders all service blocks + process", () => {
  const h = read("services.html");
  const site = JSON.parse(readFileSync("_build/data/site.json", "utf8"));
  // esc() renders "&" as the literal entity "&amp;" in output HTML, so the
  // match pattern escapes regex metachars first, then maps "&" -> "&amp;"
  // (the brief's simpler replace-& -with-"." regex only matches a single
  // char, which under-matches the 5-char "&amp;" entity it actually renders).
  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  for (const s of site.services) {
    const pattern = escapeRegExp(s.title).replace(/&/g, "&amp;");
    assert.match(h, new RegExp(pattern), s.title);
  }
  for (const step of ["Audit", "Design", "Build", "QA", "Launch"]) assert.ok(h.includes(step));
});

// The services index is the page's table of contents — every card must jump
// to a block that actually exists, or the page silently sends people nowhere.
test("services index lists every service and each card anchors to a real block", async () => {
  const site = JSON.parse(readFileSync("_build/data/site.json", "utf8"));
  const h = read("services.html");
  const index = h.slice(h.indexOf('class="svc-index"'), h.indexOf("</ul>", h.indexOf('class="svc-index"')));

  const hrefs = [...index.matchAll(/href="#([a-z-]+)"/g)].map((m) => m[1]);
  assert.equal(hrefs.length, site.services.length, "one index card per service");

  for (const id of hrefs) {
    assert.ok(h.includes(`<section id="${id}"`), `index card #${id} lands on a real block`);
  }
});

// The proof lines claim real counts of real work. They're derived from
// projects.json at build time, and this pins them to it — a service must never
// advertise work that isn't there, and the three services with no matching
// projects must show no count rather than a fabricated one.
test("service proof counts match projects.json, and unbacked services claim nothing", () => {
  const projects = JSON.parse(readFileSync("_build/data/projects.json", "utf8"));
  const list = Array.isArray(projects) ? projects : projects.projects;
  const h = read("services.html");

  const countOf = (type) => list.filter((p) => p.type === type).length;
  const expected = {
    rebuilds: countOf("Redesign"),
    "new-builds": countOf("New Build"),
    ecommerce: countOf("Cart &amp; Theme Upgrade"),
  };

  for (const [id, n] of Object.entries(expected)) {
    assert.ok(n > 0, `${id} should have matching projects to claim`);
    const block = h.slice(h.indexOf(`<section id="${id}"`), h.indexOf("</section>", h.indexOf(`<section id="${id}"`)));
    assert.match(
      block,
      new RegExp(`<strong>${n} of the ${list.length} projects</strong>`),
      `${id} proof line states the real count`
    );
    // Hash, not ?type= — clean-URL hosts 301 away the query string.
    assert.match(block, /href="work\.html#type=/, `${id} proof link survives a clean-URL redirect`);
  }

  // No projects of that kind => no claim at all.
  for (const id of ["app-product", "wordpress-care", "ai-delivery"]) {
    const block = h.slice(h.indexOf(`<section id="${id}"`), h.indexOf("</section>", h.indexOf(`<section id="${id}"`)));
    assert.ok(!/service-block-proof/.test(block), `${id} must not claim work it has none of`);
  }
});

// Grid items default to align-self: stretch, so the count pill grew to fill
// whatever vertical slack its card had left — the card with the shortest
// teaser rendered a visibly fatter pill (34px) than its neighbours (27px).
// Both declarations are load-bearing, not cosmetic.
test("services index count pill is pinned, not stretched by its grid row", () => {
  const css = read("assets/css/styles.css");
  const pill = css.match(/\.svc-index-count \{[^}]*\}/s);
  assert.ok(pill, "found .svc-index-count");
  assert.match(pill[0], /align-self: end;/, "pill must not inherit grid's stretch default");

  const card = css.match(/\.svc-index-card \{[^}]*\}/s);
  assert.ok(card, "found .svc-index-card");
  assert.match(
    card[0],
    /grid-template-rows: auto 1fr auto;/,
    "teaser row must absorb the slack so pills share a baseline"
  );
});

test("services page has anchors for every service id", () => {
  const h = read("services.html");
  const site = JSON.parse(readFileSync("_build/data/site.json", "utf8"));
  for (const s of site.services) assert.match(h, new RegExp(`id="${s.id}"`), s.id);
});

test("services page has a real platforms strip", () => {
  const h = read("services.html");
  for (const platform of ["WordPress", "PinnacleCart", "Shopify", "WP Engine"]) assert.ok(h.includes(platform), platform);
});

test("services page CTA links to contact.html", () => {
  const h = read("services.html");
  assert.match(h, /class="[^"]*cta-panel[^"]*"[\s\S]*?href="contact\.html"/);
});

// --- About page (Task 10; rev3 revised) -------------------------------------

test("about page renders the real summary and the code/terminal motif (no portrait/CV)", () => {
  const h = read("about.html");
  const cv = JSON.parse(readFileSync("_build/data/cv.json", "utf8"));
  assert.ok(h.includes(cv.summary.slice(0, 30)));
  assert.match(h, /class="code-motif"/);
  assert.doesNotMatch(h, /Chris_Dave_Magahis_CV\.pdf/);
  assert.doesNotMatch(h, /portrait\.jpg/);
});

test("about page has exactly one h1", () => {
  const h = read("about.html");
  assert.equal((h.match(/<h1[\s>]/g) || []).length, 1);
});

test("about page renders every skills group", () => {
  const h = read("about.html");
  const cv = JSON.parse(readFileSync("_build/data/cv.json", "utf8"));
  // esc() renders "&" as the literal entity "&amp;" in output HTML (see the
  // services-page test above for the same note).
  for (const group of cv.skills) assert.ok(h.includes(group.group.replace(/&/g, "&amp;")), group.group);
});

// rev3 owner feedback: a list of past EMPLOYERS reads like a résumé on a
// site promoting the owner's own studio, so the experience timeline was
// reframed into a de-identified "background" band (years + region +
// capability copy, no company names). Assert both halves of that: the
// background section itself renders, AND none of the former employer
// names leak onto the page.
test("about page's 'how I got here' is the craft arc — phases, no employers, no dates", () => {
  const h = read("about.html");
  assert.match(h, /id="background"/);
  assert.match(h, /20\+ years, condensed\./);
  // Reframed as a numbered craft-arc progression, not a dated timeline.
  assert.match(h, /class="phase-track"/);
  const bg = h.slice(h.indexOf('id="background"'), h.indexOf("</section>", h.indexOf('id="background"')));
  for (const label of ["Hand-coded", "CMS &amp; frameworks", "Agentic"]) {
    assert.match(bg, new RegExp(`class="phase-label">${label}<`), `phase ${label}`);
  }
  // The present phase is flagged as "Now".
  assert.match(bg, /phase--now/);
  assert.match(bg, /class="phase-badge">Now</);
  // Real tools shown as chips (grounded in cv.json skills, not decoration).
  for (const tag of ["HTML5", "WordPress", "MCP"]) {
    assert.match(bg, new RegExp(`<li>${tag}</li>`), `tag ${tag}`);
  }
  // No employer names anywhere on the page...
  const cv = JSON.parse(readFileSync("_build/data/cv.json", "utf8"));
  const employers = [...cv.experience, ...cv.earlierExperience].map((r) => r.company);
  for (const company of employers) {
    assert.doesNotMatch(h, new RegExp(company.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${company} should not appear on about.html`);
  }
  // ...and no résumé dates in the section — the whole point of the reframe.
  assert.doesNotMatch(bg, /\b(19|20)\d\d\b/, "no year in the craft-arc section");
});

test("about page code motif is a decorative window-chrome card (aria-hidden, dots, filename, real token snippet)", () => {
  const h = read("about.html");
  assert.match(h, /<div class="code-motif" aria-hidden="true">/);
  assert.match(h, /class="code-motif-bar"/);
  assert.equal((h.match(/class="code-motif-dot"/g) || []).length, 3);
  assert.match(h, /class="code-motif-file"/);
  assert.match(h, /class="code-motif-body"/);
  // The snippet quotes this project's own real tokens, not fabricated ones.
  assert.match(h, /--radius-lg/);
  assert.match(h, /--fs-md/);
});

test("about page CTA links to contact.html", () => {
  const h = read("about.html");
  assert.match(h, /class="[^"]*cta-panel[^"]*"[\s\S]*?href="contact\.html"/);
});

// --- Contact page (Task 11) -------------------------------------------------

test("contact form posts to formspree and has honeypot + channels", () => {
  const h = read("contact.html");
  assert.match(h, /action="https:\/\/formspree\.io\/f\/mnjepezn"/);
  assert.match(h, /method="POST"/);
  assert.match(h, /name="_gotcha"/);
  assert.match(h, /mailto:chriz\.magahis@gmail\.com/);
  assert.match(h, /wa\.me\/639692821388/);
  assert.match(h, /chrizmagahis/); // Discord handle
  assert.match(h, /github\.com\/chrizrock/);
});

test("contact form has every required field with a label", () => {
  const h = read("contact.html");
  for (const [id, name] of [
    ["cf-name", "name"],
    ["cf-email", "email"],
    ["cf-project-type", "project_type"],
    ["cf-message", "message"],
  ]) {
    assert.match(h, new RegExp(`<label class="form-label" for="${id}">`), `${name} label`);
    assert.match(h, new RegExp(`id="${id}" name="${name}"[\\s\\S]{0,20}required`), `${name} required`);
    assert.match(h, new RegExp(`aria-describedby="${id}-error"`), `${name} aria-describedby`);
  }
});

test("contact honeypot is accessibly hidden, not just visually", () => {
  const h = read("contact.html");
  assert.match(h, /<div class="sr-only" aria-hidden="true">[\s\S]*?name="_gotcha"[\s\S]*?<\/div>/);
  assert.match(h, /name="_gotcha"[^>]*tabindex="-1"/);
  assert.match(h, /name="_gotcha"[^>]*autocomplete="off"/);
});

test("contact page has exactly one h1", () => {
  const h = read("contact.html");
  assert.equal((h.match(/<h1[\s>]/g) || []).length, 1);
});

test("contact form min-height inputs and accessible-required markers present", () => {
  const h = read("contact.html");
  assert.match(h, /class="form-input"/);
  assert.match(h, /aria-required="true"/);
});

test("contact page no longer shows the removed 'no pitch deck' closing line, and the hollow wrapper is gone too", () => {
  const h = read("contact.html");
  assert.doesNotMatch(h, /No pitch deck/);
  assert.doesNotMatch(h, /contact-closing/);
});
