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

test("home shows the 3 featured projects", () => {
  const h = read("index.html");
  for (const slug of ["princess-purse", "madrona-recovery", "component-supply"])
    assert.match(h, new RegExp(`data-slug="${slug}"`));
});

test("home stat band renders 4 stats", () => {
  assert.ok((read("index.html").match(/class="[^"]*stat-tile\b/g) || []).length >= 4);
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

test("work page featured tier includes bevel-heaven plus the 3 home-featured projects", () => {
  const h = read("work.html");
  for (const slug of ["princess-purse", "madrona-recovery", "component-supply", "bevel-heaven"])
    assert.match(h, new RegExp(`data-slug="${slug}"`), slug);
  assert.match(h, /Featured/);
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

// --- About page (Task 10) --------------------------------------------------

test("about page renders summary, portrait, and CV download", () => {
  const h = read("about.html");
  assert.match(h, /Chris_Dave_Magahis_CV\.pdf/);
  assert.match(h, /portrait\.jpg/);
  const cv = JSON.parse(readFileSync("_build/data/cv.json", "utf8"));
  assert.ok(h.includes(cv.summary.slice(0, 30)));
});

test("about page has exactly one h1", () => {
  const h = read("about.html");
  assert.equal((h.match(/<h1[\s>]/g) || []).length, 1);
});

test("about page renders every skills group and every experience role", () => {
  const h = read("about.html");
  const cv = JSON.parse(readFileSync("_build/data/cv.json", "utf8"));
  // esc() renders "&" as the literal entity "&amp;" in output HTML (see the
  // services-page test above for the same note).
  for (const group of cv.skills) assert.ok(h.includes(group.group.replace(/&/g, "&amp;")), group.group);
  for (const role of cv.experience) assert.ok(h.includes(role.company.replace(/&/g, "&amp;")), role.company);
  for (const role of cv.earlierExperience) assert.ok(h.includes(role.company.replace(/&/g, "&amp;")), role.company);
});

test("about page portrait has explicit width/height and real alt text", () => {
  const h = read("about.html");
  assert.match(h, /<img class="about-portrait-img" src="assets\/img\/portrait\.jpg" alt="Chris Dave Magahis"\s+width="560" height="560"/);
});

test("about page CTA links to contact.html", () => {
  const h = read("about.html");
  assert.match(h, /class="[^"]*cta-panel[^"]*"[\s\S]*?href="contact\.html"/);
});
