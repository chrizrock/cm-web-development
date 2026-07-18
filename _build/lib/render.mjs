export const esc = (s) => String(s ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");
const RAW = Symbol("raw");
export const raw = (s) => ({ [RAW]: String(s), toString() { return this[RAW]; } });
const render = (v) => (v && v[RAW] !== undefined) ? v[RAW]
  : Array.isArray(v) ? v.map(render).join("") : esc(v);
export const html = (strings, ...values) =>
  raw(strings.reduce((out, s, i) => out + s + (i < values.length ? render(values[i]) : ""), ""));
export const attr = (o) => Object.entries(o)
  .filter(([, v]) => v != null && v !== false)
  .map(([k, v]) => v === true ? ` ${k}` : ` ${k}="${esc(v)}"`).join("");

// Turns a raw() wrapper (or a plain string/array) into its final HTML
// string. Public escape hatch for callers that need the finished markup
// out of a raw() result — e.g. build.mjs writing the assembled page shell
// to disk — without reaching into the private RAW symbol themselves.
export const serialize = (v) => render(v);
