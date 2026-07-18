// Shared footer. Single source of truth across all 5 pages — takes no
// arguments, so its output is byte-identical everywhere. Reads site.json
// itself so contact/nav never get hard-coded here.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { html, raw } from "../lib/render.mjs";
import { decodeData } from "../lib/decode.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const site = decodeData(
  JSON.parse(readFileSync(path.join(__dirname, "../data/site.json"), "utf8"))
);
const logoSvg = readFileSync(
  path.join(__dirname, "../../assets/img/logo/cm-logo-current.svg"),
  "utf8"
).trim();

export default function footer() {
  const { contact, nav, meta } = site;
  const navLinks = nav.map((link) => html`<li><a href="${link.href}">${link.label}</a></li>`);

  return html`<footer class="site-footer">
  <div class="container footer-inner">
    <div class="footer-brand">
      <span class="logo logo--footer" aria-hidden="true">${raw(logoSvg)}</span>
      <p class="footer-tagline">${meta.tagline}</p>
    </div>
    <nav class="footer-nav" aria-label="Footer">
      <ul>${navLinks}</ul>
    </nav>
    <div class="footer-contact">
      <a href="mailto:${contact.email}">${contact.email}</a>
      <a href="${contact.whatsapp}">${contact.whatsappDisplay}</a>
      <span>Discord: ${contact.discord}</span>
      <a href="${contact.github}">GitHub</a>
      <p class="footer-location">${contact.location}</p>
    </div>
  </div>
</footer>`;
}
