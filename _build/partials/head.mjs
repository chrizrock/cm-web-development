// Shared <head> partial. Single source of truth for meta, OG/Twitter tags,
// favicon, preloaded self-hosted fonts, stylesheet, and the pre-paint theme
// script (no flash of wrong theme on load).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { html, raw } from "../lib/render.mjs";
import { decodeData } from "../lib/decode.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const site = decodeData(
  JSON.parse(readFileSync(path.join(__dirname, "../data/site.json"), "utf8"))
);

const FONT_PRELOADS = [
  "assets/fonts/space-grotesk-500.woff2",
  "assets/fonts/space-grotesk-700.woff2",
  "assets/fonts/inter-400.woff2",
  "assets/fonts/inter-500.woff2",
  "assets/fonts/inter-600.woff2",
];

// Pre-paint theme script: reads the persisted theme before first paint so
// there is no flash of the wrong theme. Dark is the default.
const PRE_PAINT_SCRIPT = `try {
    var t = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", t);
  } catch (e) { document.documentElement.setAttribute("data-theme", "dark"); }`;

/**
 * GoatCounter — cookieless analytics, ~3KB, loaded async so it never blocks
 * rendering or delays first paint. No cookies, no personal data, no consent
 * banner needed.
 *
 * Driven by site.json -> meta.goatcounter (the site CODE, e.g. "chrizrock",
 * not the full URL). Omit or empty that value and no script is emitted at all
 * — which is what keeps analytics out of local builds if you ever want that.
 *
 * count.js skips localhost and private IP ranges on its own, so `npm run
 * serve` on :5050 never pollutes the stats.
 */
const analytics = (code) =>
  code
    ? html`<script data-goatcounter="https://${code}.goatcounter.com/count"
        async src="//gc.zgo.at/count.js"></script>`
    : "";

export default function head({ title, description, page }) {
  const { meta } = site;
  const fullTitle = title ? `${title} — ${meta.siteName}` : `${meta.siteName} — ${meta.tagline}`;
  const desc = description || meta.description;
  // `page` is the flat filename (e.g. "services.html"); Home's flat file
  // (index.html) still canonicalizes to the bare domain root.
  const canonicalPath = page === "index.html" ? "/" : `/${page}`;
  const canonical = `${meta.url}${canonicalPath}`;
  const ogImage = `${meta.url}/${meta.ogImage}`;

  return html`<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${fullTitle}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="${meta.ogType}">
<meta property="og:site_name" content="${meta.siteName}">
<meta property="og:title" content="${fullTitle}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImage}">
<meta name="twitter:card" content="${meta.twitterCard}">
<meta name="twitter:title" content="${fullTitle}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${ogImage}">
<link rel="icon" type="image/png" href="${meta.favicon}">
<link rel="apple-touch-icon" href="${meta.appleTouchIcon}">
${FONT_PRELOADS.map(
  (href) =>
    html`<link rel="preload" as="font" type="font/woff2" href="${href}" crossorigin>`
)}
<link rel="stylesheet" href="assets/css/styles.css">
<script>
  ${raw(PRE_PAINT_SCRIPT)}
</script>
${analytics(meta.goatcounter)}
</head>`;
}
