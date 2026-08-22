// All dates are local-time "YYYY-MM-DD" strings, so a day flips at your
// midnight, not UTC's.

export function ymd(d) {
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

export function today() {
  return ymd(new Date());
}

export function parseYmd(s) {
  const [y, m, d] = s.split("-");
  return new Date(+y, +m - 1, +d);
}

export function shiftDays(s, n) {
  const d = parseYmd(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
}

export function pretty(s) {
  const t = today();
  if (s === t) return "Today";
  if (s === shiftDays(t, -1)) return "Yesterday";
  return parseYmd(s).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Whole days from date string `a` to date string `b`. Negative if b is past. */
export function daysBetween(a, b) {
  const ms = parseYmd(b).getTime() - parseYmd(a).getTime();
  return Math.round(ms / 86400000); // round absorbs any DST hour shift
}

export function longDate(s) {
  return parseYmd(s).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
