import { TOTAL, TARGET_DATE } from "./constants.js";
import {
  today,
  shiftDays,
  longDate,
  daysBetween,
  weekStartOf,
  weekEndOf,
} from "./dates.js";

// index 0 is hour 2500, index 2499 is hour 1
export const hourOf = (index) => TOTAL - index;

/**
 * "38h 15m", or plain "38h" on a whole hour.
 *
 * Note every hour in this app is logged as one whole checkbox, so today's data
 * can only ever produce whole hours — the minutes branch exists so the figure
 * stays correct if part-hours are ever logged.
 */
export function formatHM(hours) {
  const minutes = Math.round(hours * 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Bucket already-built day rows into Saturday-to-Friday weeks, newest first.
 *
 * Derived from the saved data on every call — nothing here is written back to
 * storage. `rows` arrives newest-first, so both the weeks and the days inside
 * each week come out in that order without re-sorting.
 */
export function groupByWeek(rows) {
  const t = today();
  const currentStart = weekStartOf(t);

  // Seed the running week so it still shows (at 0h) on a week with nothing
  // logged yet — otherwise "this week so far" would silently disappear.
  const order = [currentStart];
  const byStart = new Map([
    [currentStart, { start: currentStart, end: weekEndOf(t), hours: 0, rows: [] }],
  ]);

  for (const row of rows) {
    const start = weekStartOf(row.day);
    if (!byStart.has(start)) {
      byStart.set(start, { start, end: weekEndOf(row.day), hours: 0, rows: [] });
      order.push(start);
    }
    const week = byStart.get(start);
    week.hours += row.n;
    week.rows.push(row);
  }

  // Sort rather than trust insertion order: a future-dated entry would
  // otherwise land after the seeded current week instead of above it.
  order.sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));

  return order.map((start) => {
    const week = byStart.get(start);
    return {
      ...week,
      isCurrent: week.start === currentStart,
      // Once the closing Friday is behind us the week can no longer grow.
      completed: week.end < t,
    };
  });
}

/**
 * Group finished hours by the day they were finished.
 * Returns { map: { "YYYY-MM-DD": {n, hi, lo} }, undated }
 */
export function groupByDate(crossed, dates) {
  const map = {};
  let undated = 0;

  for (const index of crossed) {
    const day = dates[index];
    if (!day) {
      undated++;
      continue;
    }
    const hour = hourOf(index);
    if (!map[day]) map[day] = { n: 0, hi: hour, lo: hour };
    map[day].n++;
    if (hour > map[day].hi) map[day].hi = hour;
    if (hour < map[day].lo) map[day].lo = hour;
  }

  return { map, undated };
}

/** Consecutive days studied. Not having logged today yet doesn't break it. */
export function streakOf(map) {
  let day = today();
  if (!map[day]) day = shiftDays(day, -1);
  let streak = 0;
  while (map[day]) {
    streak++;
    day = shiftDays(day, -1);
  }
  return streak;
}

export function summarize(crossed, dates) {
  const { map, undated } = groupByDate(crossed, dates);
  const keys = Object.keys(map).sort(); // oldest -> newest

  const hoursDone = crossed.length;
  const hoursLeft = TOTAL - hoursDone;
  const loggedWithDate = keys.reduce((a, k) => a + map[k].n, 0);
  const days = keys.length;
  const avg = days ? loggedWithDate / days : 0;

  // Days ranked by hours. The keys are unique dates, so the runner-up is always
  // a different date from the winner even when the two tie on hours; sorting
  // ties by date just makes which one wins deterministic.
  const byHours = keys
    .map((day) => ({ day, n: map[day].n }))
    .sort((a, b) => b.n - a.n || (a.day < b.day ? -1 : 1));

  const best = byHours[0]?.n ?? 0;
  const secondBestDay = byHours[1] ?? null; // null with fewer than 2 days logged

  // newest first, with a running total
  let run = 0;
  const rows = keys
    .map((k) => {
      run += map[k].n;
      return { day: k, ...map[k], cumulative: run, leftAfter: TOTAL - run };
    })
    .reverse();

  const last30 = [];
  for (let k = 29; k >= 0; k--) {
    const day = shiftDays(today(), -k);
    last30.push({ day, n: map[day] ? map[day].n : 0 });
  }

  // --- this week (Sat -> Fri), recomputed from the saved days ---------
  const weekStart = weekStartOf(today());
  const weekEnd = shiftDays(weekStart, 6);
  const thisWeekHours = keys.reduce(
    (a, k) => (k >= weekStart && k <= weekEnd ? a + map[k].n : a),
    0
  );

  // --- deadline maths -------------------------------------------------
  const daysToTarget = daysBetween(today(), TARGET_DATE);
  const targetPassed = daysToTarget < 0;
  // Count today as a day you can still study, so a same-day deadline needs
  // the remaining hours today rather than dividing by zero.
  const daysUsable = Math.max(daysToTarget + 1, 1);
  const requiredPerDay = hoursLeft / daysUsable;
  const todayHours = map[today()] ? map[today()].n : 0;
  const onTrack = hoursLeft === 0 || (avg > 0 && avg >= requiredPerDay);

  return {
    map,
    undated,
    rows,
    last30,
    hoursDone,
    hoursLeft,
    percent: (hoursDone / TOTAL) * 100,
    todayHours,
    streak: streakOf(map),
    days,
    avg,
    best,
    secondBestDay,

    weeks: groupByWeek(rows),
    weekStart,
    weekEnd,
    thisWeekHours,

    target: TARGET_DATE,
    targetLabel: longDate(TARGET_DATE),
    daysToTarget,
    targetPassed,
    requiredPerDay,
    onTrack,
    behindBy: Math.max(0, requiredPerDay - avg),
    remainingToday: Math.max(0, Math.ceil(requiredPerDay) - todayHours),
  };
}
