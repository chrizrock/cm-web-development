// The studio's real 5-step process — the SINGLE source of truth shared by the
// Services "Five steps, every project" band (renders the full `copy`) and the
// Home hero pipeline (renders the compact `node` descriptor). Factored out of
// pages/services.mjs so the two surfaces can never drift: same steps, same
// wording, in one place.
//
// `copy`  — the full, on-brand line Services shows under each step. Real
//           practices from cv.json (cross-browser + pixel-parity QA), not
//           invented.
// `node`  — the terse descriptor the hero pipeline shows per node. It is a
//           VERBATIM leading clause of that step's own `copy` (the same real
//           words, sentence-cased with a period) — a condensation of the real
//           text, never a new claim. Kept in sync here by construction.
export const PROCESS_STEPS = [
  {
    name: "Audit",
    copy: "Review the live site (or the mockup) and flag exactly what's costing conversions — cluttered navigation, a hero that isn't selling, a layout that breaks on a phone.",
    node: "Flag exactly what's costing conversions.",
  },
  {
    name: "Design",
    copy: "Rebuild the hierarchy around the brand and content that's already there — real product photography and copy, not stock filler stacked on top.",
    node: "Rebuild the hierarchy around the brand and content that's already there.",
  },
  {
    name: "Build",
    copy: "Hand-code semantic, responsive HTML/CSS — or work inside WordPress, PinnacleCart, or Shopify — with no page-builder bloat and no framework overhead.",
    node: "Hand-code semantic, responsive HTML/CSS.",
  },
  {
    name: "QA",
    copy: "Cross-browser, multi-resolution testing, checked against pixel-parity so what ships matches the design exactly, not approximately.",
    node: "Cross-browser, multi-resolution testing.",
  },
  {
    name: "Launch",
    copy: "Hosting, domains, DNS, and email set up as part of the build; live stores migrated without losing catalog, customers, or traffic.",
    node: "Hosting, domains, DNS, and email set up as part of the build.",
  },
];
