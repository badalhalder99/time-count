const TOTAL = 2500;

// Deliberately strict. Number(null) and Number("") are both 0, so a loose
// Number() cast would silently cross off hour 2500 when junk arrives.
function toIndex(v) {
  if (typeof v === "number") return Number.isInteger(v) ? v : NaN;
  if (typeof v === "string" && /^\d+$/.test(v)) return Number(v);
  return NaN;
}

function inRange(i) {
  return Number.isInteger(i) && i >= 0 && i < TOTAL;
}

function cleanCrossed(input) {
  if (!Array.isArray(input)) return [];
  const seen = new Set();
  for (const v of input) {
    const i = toIndex(v);
    if (inRange(i)) seen.add(i);
  }
  return Array.from(seen).sort((a, b) => a - b);
}

function cleanDates(input) {
  const out = {};
  if (!input || typeof input !== "object" || Array.isArray(input)) return out;
  for (const key of Object.keys(input)) {
    const i = toIndex(key);
    const v = input[key];
    if (inRange(i) && typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
      out[i] = v;
    }
  }
  return out;
}

module.exports = { TOTAL, toIndex, cleanCrossed, cleanDates };
