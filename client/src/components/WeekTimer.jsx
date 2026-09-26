import { useEffect, useState } from "react";
import { HOURS_PER_WEEK } from "../lib/constants.js";
import { parseYmd, shiftDays, today, weekStartOf } from "../lib/dates.js";

const WEEK_SECS = HOURS_PER_WEEK * 3600;

// Counts down the 168 hours of the current Saturday-to-Friday week. The time
// left is derived from the clock on every tick (never stored), so it starts
// over at 168:00:00 on its own when Saturday 00:00 arrives.
function remaining() {
  const now = Date.now();
  const next = parseYmd(shiftDays(weekStartOf(today()), 7));
  const secs = Math.max(Math.floor((next.getTime() - now) / 1000), 0);
  return {
    hours: Math.floor(secs / 3600),
    minutes: Math.floor(secs / 60) % 60,
    seconds: secs % 60,
    // share of the week already gone, for the thin progress bar
    elapsed: Math.min(Math.max(1 - secs / WEEK_SECS, 0), 1) * 100,
    resetsOn: next.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
  };
}

const pad = (n) => String(n).padStart(2, "0");

function Seg({ value, label, lead }) {
  return (
    <div className={"wt-seg" + (lead ? " lead" : "")}>
      <span className="wt-val">{value}</span>
      <span className="wt-unit">{label}</span>
    </div>
  );
}

export default function WeekTimer() {
  const [left, setLeft] = useState(remaining);

  useEffect(() => {
    const id = setInterval(() => setLeft(remaining()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="week-timer"
      role="timer"
      aria-label={`${left.hours} hours ${left.minutes} minutes left this week`}
    >
      <div className="wt-head">
        <span className="wt-live" aria-hidden="true" />
        <span className="wt-title">This week</span>
        <span className="wt-total">{HOURS_PER_WEEK}h</span>
      </div>

      <div className="wt-clock">
        <Seg value={pad(left.hours)} label="hrs" lead />
        <span className="wt-colon" aria-hidden="true">:</span>
        <Seg value={pad(left.minutes)} label="min" />
        <span className="wt-colon" aria-hidden="true">:</span>
        <Seg value={pad(left.seconds)} label="sec" />
      </div>

      <div className="wt-bar" aria-hidden="true">
        <div className="wt-bar-fill" style={{ width: left.elapsed + "%" }} />
      </div>

      <div className="wt-foot">
        <span>{left.elapsed.toFixed(1)}% gone</span>
        <span>Resets {left.resetsOn}</span>
      </div>
    </div>
  );
}
