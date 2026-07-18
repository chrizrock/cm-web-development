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
  const navLinks = site.nav.map((link) => {
    const isActive = link.href === page;
    // NOTE: the trailing space before the conditional slot is intentional and
    // always present (active or not) so the no-drift test — which strips only
    // the literal string `aria-current="page"` — sees byte-identical markup
    // once the active-state text is removed.
    return html`<li><a href="${link.href}" ${raw(isActive ? 'aria-current="page"' : "")}>${link.label}</a></li>`;
  });

  return html`<header class="site-header glass">
  <div class="container header-inner">
    <a class="logo"${raw(attr({ href: "/", "aria-label": `${site.meta.siteName} home` }))}>${raw(logoSvg)}</a>
    <nav class="site-nav" aria-label="Primary">
      <ul>${navLinks}</ul>
    </nav>
    <div class="header-actions">
      <a class="btn btn--primary" href="contact.html">Start a project</a>
      <button type="button" class="theme-toggle" aria-pressed="false" aria-label="Switch to light theme">
        <span class="theme-toggle-icon" aria-hidden="true"></span>
      </button>
    </div>
  </div>
</header>`;
}
