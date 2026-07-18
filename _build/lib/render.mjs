export const esc = (s) => String(s ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");
const RAW = Symbol("raw");
export const raw = (s) => ({ [RAW]: String(s) });
const render = (v) => (v && v[RAW] !== undefined) ? v[RAW]
  : Array.isArray(v) ? v.map(render).join("") : esc(v);
export const html = (strings, ...values) =>
  raw(strings.reduce((out, s, i) => out + s + (i < values.length ? render(values[i]) : ""), ""));
export const attr = (o) => Object.entries(o)
  .filter(([, v]) => v != null && v !== false)
  .map(([k, v]) => v === true ? ` ${k}` : ` ${k}="${esc(v)}"`).join("");
