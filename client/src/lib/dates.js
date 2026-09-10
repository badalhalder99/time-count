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

/** "Sat, Sep 5, 2026" — a single day, spelled out with its weekday. */
export function dayDate(s) {
  return parseYmd(s).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * The Saturday that opens the week containing `s`. Weeks run Saturday 00:00 to
 * Friday 23:59:59 local time.
 *
 * Every stamp in this app is already a local "YYYY-MM-DD" (see ymd above), so
 * the boundary falls out for free: an entry made at Friday 23:59 carries that
 * Friday's date and stays in the closing week, while one made a minute later at
 * Saturday 00:00 carries the Saturday and opens the next.
 */
export function weekStartOf(s) {
  const d = parseYmd(s);
  // getDay(): 0=Sun … 6=Sat. Days to step back to reach Saturday:
  // Sat->0, Sun->1, Mon->2, Tue->3, Wed->4, Thu->5, Fri->6
  const back = (d.getDay() + 1) % 7;
  d.setDate(d.getDate() - back);
  return ymd(d);
}

/** The Friday that closes the week containing `s`. */
export function weekEndOf(s) {
  return shiftDays(weekStartOf(s), 6);
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
