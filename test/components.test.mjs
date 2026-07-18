// Reusable components module (Task 5). Tests assert REAL markup shape —
// screenshot paths, new-build graceful fallback, a11y hooks, and the
// data-* hooks Task 6's wipe JS will wire up.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  button,
  section,
  statTile,
  serviceCard,
  projectCard,
  beforeAfter,
} from "../_build/partials/components.mjs";
import { decodeData } from "../_build/lib/decode.mjs";
import { esc } from "../_build/lib/render.mjs";

// Components receive already-decoded data (build.mjs's job to decode before
// passing project/site objects in) — mirror that here, same as data.test.mjs.
const P = decodeData(JSON.parse(readFileSync("_build/data/projects.json", "utf8")));
const find = (slug) => P.find((p) => p.slug === slug);

// --- beforeAfter -----------------------------------------------------------

test("beforeAfter references real before+after screenshot paths for a project with an 'old' site", () => {
  const p = find("princess-purse");
  assert.ok(p.old, "fixture assumption: princess-purse has an old site");
  const s = String(beforeAfter({ project: p }));
  assert.match(s, /princess-purse-after-desktop\.jpg/);
  assert.match(s, /princess-purse-before-desktop\.jpg/);
  assert.match(s, /princess-purse-after-mobile\.jpg/);
  assert.match(s, /princess-purse-before-mobile\.jpg/);
});

test("beforeAfter wires the wipe hooks (data-beforeafter, --wipe target, range input, aria-pressed toggle)", () => {
  const p = find("princess-purse");
  const s = String(beforeAfter({ project: p }));
  assert.match(s, /data-beforeafter(?!-)/, "container hook");
  assert.match(s, /--wipe/, "custom-property target");
  assert.match(s, /<input[^>]*type="range"[^>]*data-beforeafter-range/, "keyboard-accessible range");
  assert.match(s, /aria-pressed="false"/, "toggle control for Task 6");
});

test("beforeAfter gracefully handles a new-build project with no before image", () => {
  const p = find("7-day-drapes");
  assert.ok(!p.old, "fixture assumption: 7-day-drapes has no old site");
  const s = String(beforeAfter({ project: p }));
  assert.match(s, /7-day-drapes-after-desktop\.jpg/);
  assert.match(s, /New build/);
  assert.doesNotMatch(s, /7-day-drapes-before-/);
  // No wipe control on a new-build (nothing to compare).
  assert.doesNotMatch(s, /data-beforeafter-range/);
  assert.doesNotMatch(s, /aria-pressed/);
});

test("beforeAfter handles the other documented new-build slug (component-supply-blog)", () => {
  const p = find("component-supply-blog");
  assert.ok(!p.old);
  const s = String(beforeAfter({ project: p }));
  assert.match(s, /component-supply-blog-after-desktop\.jpg/);
  assert.match(s, /New build/);
  assert.doesNotMatch(s, /component-supply-blog-before-/);
});

test("beforeAfter images carry real alt text, lazy loading, and width/height (no CLS)", () => {
  const p = find("madrona-recovery");
  const s = String(beforeAfter({ project: p }));
  assert.match(s, /alt="Madrona Recovery — before"/);
  assert.match(s, /loading="lazy"/);
  assert.match(s, /width="\d+"\s+height="\d+"/);
});

// --- statTile ---------------------------------------------------------------

test("statTile renders value + label with a stat-tile hook and data-reveal", () => {
  const s = String(statTile({ value: "20+", label: "Years" }));
  assert.match(s, /class="[^"]*stat-tile/);
  assert.match(s, /20\+/);
  assert.match(s, />Years</);
  assert.match(s, /data-reveal/);
});

// --- serviceCard --------------------------------------------------------------

test("serviceCard renders title, summary, and links to href", () => {
  const s = String(
    serviceCard({ title: "Website Rebuilds", summary: "A rebuild of the site you already have.", href: "services.html#rebuilds" })
  );
  assert.match(s, /Website Rebuilds/);
  assert.match(s, /A rebuild of the site you already have\./);
  assert.match(s, /href="services\.html#rebuilds"/);
  assert.match(s, /data-reveal/);
});

// --- projectCard --------------------------------------------------------------

test("projectCard carries data-slug + data-type for filtering and embeds beforeAfter", () => {
  const p = find("bevel-heaven");
  const s = String(projectCard({ project: p }));
  assert.match(s, /data-slug="bevel-heaven"/);
  // data-type is HTML-attribute-escaped (single &amp;, browsers decode it back
  // to "Cart & Theme Upgrade" when JS reads dataset.type) — same round trip
  // asserted in build.test.mjs's decodeEntities -> esc() test.
  assert.match(s, new RegExp(`data-type="${esc(p.type)}"`));
  assert.match(s, /bevel-heaven-after-desktop\.jpg/);
  assert.match(s, /Bevel Heaven/);
  assert.match(s, /data-reveal/);
});

test("projectCard featured variant carries a featured hook", () => {
  const p = find("princess-purse");
  const s = String(projectCard({ project: p, featured: true }));
  assert.match(s, /featured/);
});

// --- button / section (composition primitives) --------------------------------

test("button renders label, href, and defaults to the primary variant", () => {
  const s = String(button({ label: "Start a project", href: "contact.html" }));
  assert.match(s, /class="[^"]*btn--primary/);
  assert.match(s, /href="contact\.html"/);
  assert.match(s, />Start a project</);
});

test("button supports a ghost variant", () => {
  const s = String(button({ label: "See the work", href: "work.html", variant: "ghost" }));
  assert.match(s, /class="[^"]*btn--ghost/);
});

test("section wraps eyebrow/title/intro/children and carries data-reveal + id", () => {
  const s = String(
    section({
      id: "stats",
      eyebrow: "By the numbers",
      title: "Track record",
      intro: "Two decades of hand-coded rebuilds.",
      children: String(statTile({ value: "20+", label: "Years" })),
    })
  );
  assert.match(s, /id="stats"/);
  assert.match(s, /By the numbers/);
  assert.match(s, /<h2[^>]*>Track record<\/h2>/);
  assert.match(s, /Two decades of hand-coded rebuilds\./);
  assert.match(s, /stat-tile/);
  assert.match(s, /data-reveal/);
});

// --- entity-decode passthrough (per task instructions: components must NOT
// re-decode or double-escape already-decoded data) -----------------------------

test("components pass already-decoded ampersands through as a single &amp; (no double-escape)", () => {
  const p = find("oxman-and-oxman");
  assert.equal(p.name, "Oxman & Oxman", "fixture assumption: decodeData already ran");
  const s = String(projectCard({ project: p }));
  assert.match(s, /Oxman &amp; Oxman/);
  assert.doesNotMatch(s, /&amp;amp;/);
});
