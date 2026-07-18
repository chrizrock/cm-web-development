// Build engine. pageShell() assembles the full document around a page's
// <main>; build() renders and writes all 5 static HTML files to the repo
// root. Zero runtime deps — Node built-ins only.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { html } from "./lib/render.mjs";
import head from "./partials/head.mjs";
import header from "./partials/header.mjs";
import footer from "./partials/footer.mjs";
import indexPage from "./pages/index.mjs";
import servicesPage from "./pages/services.mjs";
import workPage from "./pages/work.mjs";
import aboutPage from "./pages/about.mjs";
import contactPage from "./pages/contact.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

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

// `raw()` objects hold their string behind a private module-scoped Symbol
// (not exported by render.mjs); this is the one place that needs the
// finished string out, to hand to writeFileSync.
function unwrap(rawResult) {
  const [sym] = Object.getOwnPropertySymbols(rawResult);
  return rawResult[sym];
}

const PAGES = [
  { file: "index.html", page: "/", title: null, description: null, render: indexPage },
  { file: "services.html", page: "/services/", title: "Services", description: null, render: servicesPage },
  { file: "work.html", page: "/work/", title: "Work", description: null, render: workPage },
  { file: "about.html", page: "/about/", title: "About", description: null, render: aboutPage },
  { file: "contact.html", page: "/contact/", title: "Contact", description: null, render: contactPage },
];

export function build() {
  for (const p of PAGES) {
    const out = pageShell({
      page: p.page,
      title: p.title,
      description: p.description,
      main: p.render(),
    });
    writeFileSync(path.join(ROOT, p.file), unwrap(out), "utf8");
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  build();
}
