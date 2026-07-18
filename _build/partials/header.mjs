// Shared sticky glass header/nav. Single source of truth across all 5 pages —
// the only thing that varies per page is which nav link carries
// aria-current="page". Reads site.json itself so nav/contact never get
// hard-coded here.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { html, raw, attr } from "../lib/render.mjs";
import { decodeData } from "../lib/decode.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const site = decodeData(
  JSON.parse(readFileSync(path.join(__dirname, "../data/site.json"), "utf8"))
);
const logoSvg = readFileSync(
  path.join(__dirname, "../../assets/img/logo/cm-logo-current.svg"),
  "utf8"
).trim();

export default function header({ page }) {
  // Shared link-list builder so the desktop nav and the mobile panel render
  // byte-identical link markup (same active-state logic, same trailing-space
  // convention the no-drift test relies on).
  const buildNavLinks = () =>
    site.nav.map((link) => {
      const isActive = link.href === page;
      // NOTE: the trailing space before the conditional slot is intentional and
      // always present (active or not) so the no-drift test — which strips only
      // the literal string `aria-current="page"` — sees byte-identical markup
      // once the active-state text is removed.
      return html`<li><a href="${link.href}" ${raw(isActive ? 'aria-current="page"' : "")}>${link.label}</a></li>`;
    });

  // The mobile nav shell is rendered as a SIBLING of <header>, not nested
  // inside it. .site-header has backdrop-filter (the sticky glass nav), and
  // per spec any of backdrop-filter/filter/transform/perspective/contain on
  // an ancestor makes that ancestor the containing block for a
  // `position: fixed` descendant. Nested inside <header>, .nav-shell's
  // `inset: 0` resolved against the 72px header box instead of the
  // viewport — the panel rendered squashed into the header's height. Kept
  // as a sibling, .nav-shell has no such ancestor and sizes to the full
  // viewport correctly.
  return html`<header class="site-header">
  <div class="container header-inner">
    <a class="logo"${raw(attr({ href: "index.html", "aria-label": `${site.meta.siteName} home` }))}>${raw(logoSvg)}<span class="logo-wordmark" aria-hidden="true">Web Development</span></a>
    <nav class="site-nav" aria-label="Primary">
      <ul>${buildNavLinks()}</ul>
    </nav>
    <div class="header-actions">
      <a class="btn btn--primary" href="contact.html">Start a project</a>
      <button type="button" class="theme-toggle" aria-pressed="false" aria-label="Switch to light theme">
        <span class="theme-toggle-icon" aria-hidden="true"></span>
      </button>
      <button type="button" class="nav-toggle" aria-expanded="false" aria-controls="mobile-nav" aria-label="Open menu">
        <span class="nav-toggle-icon" aria-hidden="true"></span>
      </button>
    </div>
  </div>
</header>
<div class="nav-shell">
  <div class="nav-overlay" data-nav-overlay></div>
  <nav class="mobile-nav" id="mobile-nav" aria-label="Mobile" inert>
    <ul>${buildNavLinks()}</ul>
    <a class="btn btn--primary mobile-nav-cta" href="contact.html">Start a project</a>
  </nav>
</div>`;
}
