// Decode pre-encoded HTML entities in source data ONCE at load time, so
// downstream esc()/html() (which encode on the way out) don't double-escape
// values like "Oxman &amp; Oxman" into "Oxman &amp;amp; Oxman".
const ENTITY_MAP = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
};

const ENTITY_RE = /&amp;|&lt;|&gt;|&quot;|&#39;|&apos;/g;

export function decodeEntities(str) {
  if (typeof str !== "string") return str;
  return str.replace(ENTITY_RE, (m) => ENTITY_MAP[m]);
}

export function decodeData(value) {
  if (typeof value === "string") return decodeEntities(value);
  if (Array.isArray(value)) return value.map(decodeData);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = decodeData(v);
    return out;
  }
  return value;
}
