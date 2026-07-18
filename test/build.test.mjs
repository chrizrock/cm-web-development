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
