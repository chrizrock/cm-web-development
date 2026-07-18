// Build engine. pageShell() assembles the full document around a page's
// <main>; build() renders and writes all 5 static HTML files to the repo
// root. Zero runtime deps — Node built-ins only.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { html, serialize } from "./lib/render.mjs";
import { decodeData } from "./lib/decode.mjs";
import head from "./partials/head.mjs";
import header from "./partials/header.mjs";
import footer from "./partials/footer.mjs";
import homePage from "./pages/home.mjs";
import servicesPage from "./pages/services.mjs";
import workPage from "./pages/work.mjs";
import aboutPage from "./pages/about.mjs";
import contactPage from "./pages/contact.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

// Load + entity-decode the shared data once, then hand it to every page render
// (see the data note in components.mjs — decode happens once, at load time).
// Stub pages that take no arguments simply ignore what they're passed.
const loadJSON = (file) =>
  decodeData(JSON.parse(readFileSync(path.join(__dirname, "data", file), "utf8")));
const site = loadJSON("site.json");
const projects = loadJSON("projects.json");

export function pageShell({ page, title, description, main }) {
  return html`<!doctype html>
<html lang="en" data-theme="dark">
${head({ title, description, page })}
<body>
<a class="skip-link" href="#main">Skip to content</a>
${header({ page })}
<main id="main">${main}</main>
${footer()}
<script type="module" src="assets/js/main.js"></script>
</body>
</html>`;
}

// `page` is the flat filename identifying the current page — it doubles as
// the nav-link active-state key (compared against site.json nav[].href in
// header.mjs) and the canonical/OG-url path segment (in head.mjs), so both
// partials stay in lockstep with a single identifier per page.
const PAGES = [
  { file: "index.html", page: "index.html", title: null, description: null, render: homePage },
  { file: "services.html", page: "services.html", title: "Services", description: null, render: servicesPage },
  { file: "work.html", page: "work.html", title: "Work", description: null, render: workPage },
  { file: "about.html", page: "about.html", title: "About", description: null, render: aboutPage },
  { file: "contact.html", page: "contact.html", title: "Contact", description: null, render: contactPage },
];

export function build() {
  for (const p of PAGES) {
    const out = pageShell({
      page: p.page,
      title: p.title,
      description: p.description,
      main: p.render({ site, projects }),
    });
    writeFileSync(path.join(ROOT, p.file), serialize(out), "utf8");
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  build();
}
