import { TOTAL, TARGET_DATE } from "./constants.js";
import { today, shiftDays, longDate, daysBetween } from "./dates.js";

// index 0 is hour 2500, index 2499 is hour 1
export const hourOf = (index) => TOTAL - index;

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
  const best = keys.reduce((a, k) => Math.max(a, map[k].n), 0);

  const eta =
    hoursLeft === 0
      ? "Done!"
      : avg > 0
        ? longDate(shiftDays(today(), Math.ceil(hoursLeft / avg)))
        : "—";

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
    eta,

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
