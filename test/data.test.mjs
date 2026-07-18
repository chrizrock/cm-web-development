import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const projects = JSON.parse(readFileSync("_build/data/projects.json", "utf8"));
const site = JSON.parse(readFileSync("_build/data/site.json", "utf8"));

test("17 projects present", () => assert.equal(projects.length, 17));

test("every project has after screenshots (desktop+mobile)", () => {
  for (const p of projects) {
    assert.ok(existsSync(`assets/img/shots/${p.slug}-after-desktop.jpg`), `${p.slug} after-desktop`);
    assert.ok(existsSync(`assets/img/shots/${p.slug}-after-mobile.jpg`), `${p.slug} after-mobile`);
  }
});

test("projects with an 'old' url have before screenshots", () => {
  for (const p of projects.filter((p) => p.old)) {
    assert.ok(existsSync(`assets/img/shots/${p.slug}-before-desktop.jpg`), `${p.slug} before-desktop`);
  }
});

test("site.json has required blocks", () => {
  assert.ok(Array.isArray(site.nav) && site.nav.length >= 4);
  assert.ok(site.contact.email.includes("@"));
  assert.ok(site.services.length >= 4);
});
