import { useEffect, useState } from "react";
import { BIRTHDAY_32 } from "../lib/constants.js";
import { longDate, parseYmd } from "../lib/dates.js";

// Local midnight on the birthday. Computed once — the remaining time is
// derived from Date.now() on every tick, never hardcoded.
const TARGET = parseYmd(BIRTHDAY_32).getTime();

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function remaining(now) {
  const ms = Math.max(TARGET - now, 0);
  return {
    reached: ms === 0,
    // Days and hours are both TOTALS still in hand — hours is the whole span
    // in hours (19,778), not the 0-23 remainder inside the current day.
    totalDays: Math.floor(ms / DAY),
    totalHours: Math.floor(ms / HOUR),
    minutes: Math.floor(ms / MINUTE) % 60,
    seconds: Math.floor(ms / SECOND) % 60,
  };
}

const pad = (n) => String(n).padStart(2, "0");

function Unit({ value, label, lead }) {
  return (
    <div className={"cd-unit" + (lead ? " lead" : "")}>
      <div className="cd-value">{value}</div>
      <div className="cd-label">{label}</div>
    </div>
  );
}

export default function Countdown() {
  const [left, setLeft] = useState(() => remaining(Date.now()));

  useEffect(() => {
    let id;
    const tick = () => {
      const now = Date.now();
      setLeft(remaining(now));
      // Re-aim at the next whole second instead of a flat 1000ms interval, so
      // the display never drifts far enough to skip or repeat a second.
      id = setTimeout(tick, SECOND - (now % SECOND));
    };
    tick();
    return () => clearTimeout(id);
  }, []);

  return (
    <section className="card countdown">
      <div className="cd-head">
        <div className="cd-eyebrow">Until I turn 32</div>
        <div className="cd-target">
          <strong>{longDate(BIRTHDAY_32)}</strong>
        </div>
      </div>

      <div
        className="cd-units"
        role="timer"
        aria-label={
          left.reached
            ? "The countdown has finished"
            : left.totalDays + " days and " + left.totalHours +
              " hours left until 5 December 2028"
        }
      >
        <Unit value={left.totalDays.toLocaleString()} label="Days" lead />
        <Unit value={left.totalHours.toLocaleString()} label="Hours" lead />
        <Unit value={pad(left.minutes)} label="Minutes" />
        <Unit value={pad(left.seconds)} label="Seconds" />
      </div>

      {left.reached && <p className="cd-done">Happy 32nd birthday.</p>}
    </section>
  );
}
