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

// rev5 Change A: the hero's right column is a 5-step pipeline of the real
// process (Audit → Design → Build → QA → Launch), with the final Launch node
// visually accented as the "shipped" payoff.
test("home hero renders the 5-step pipeline with every real step label", () => {
  const h = read("index.html");
  const start = h.indexOf('class="hero-pipeline"');
  const end = h.indexOf("</section>", start);
  assert.ok(start > -1, "hero-pipeline present in the hero");
  const pipeline = h.slice(start, end);
  for (const step of ["Audit", "Design", "Build", "QA", "Launch"]) {
    assert.match(pipeline, new RegExp(`class="pipeline-node-label">${step}`), `pipeline step ${step}`);
  }
  // Launch is the accented payoff node.
  assert.match(pipeline, /pipeline-node--launch/, "Launch node accented");
  assert.match(pipeline, /class="pipeline-shipped">Shipped/, "Launch shows the shipped state");
  // Numbered 01..05 stepper.
  for (const num of ["01", "02", "03", "04", "05"])
    assert.match(pipeline, new RegExp(`class="pipeline-node-num">${num}`), `node ${num}`);
});

// The hero pipeline must reuse the REAL, shared process copy (data/process.mjs)
// — not fabricate its own — so it can never drift from the Services page.
test("home hero pipeline descriptors are the real shared process text (no drift, not fabricated)", async () => {
  const { PROCESS_STEPS } = await import("../_build/data/process.mjs");
  const h = read("index.html");
  for (const step of PROCESS_STEPS) {
    // Each `node` descriptor is a verbatim leading clause of that step's real
    // Services `copy`.
    assert.ok(step.copy.toLowerCase().includes(step.node.replace(/\.$/, "").toLowerCase()),
      `${step.name}: node descriptor is a real clause of its Services copy`);
    assert.ok(h.includes(esc(step.node)), `${step.name} node descriptor rendered in the hero`);
  }
});

test("home still has exactly one h1 after adding the pipeline", () => {
  assert.equal((read("index.html").match(/<h1[\s>]/g) || []).length, 1);
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
test("about page's background section renders (reframed, no past-employer names)", () => {
  const h = read("about.html");
  assert.match(h, /id="background"/);
  assert.match(h, /class="experience-timeline"/);
  assert.match(h, /20\+ years, condensed\./);
  const cv = JSON.parse(readFileSync("_build/data/cv.json", "utf8"));
  const employers = [...cv.experience, ...cv.earlierExperience].map((r) => r.company);
  for (const company of employers) {
    assert.doesNotMatch(h, new RegExp(company.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${company} should not appear on about.html`);
  }
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
