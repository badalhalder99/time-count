import { useEffect, useState } from "react";
import { HOURS_PER_WEEK } from "../lib/constants.js";

const WEEK_SECS = HOURS_PER_WEEK * 3600;
const RESET_HOUR = 6; // Saturday 06:00 local time

/** The next Saturday 06:00 (local) strictly after `now`. */
function nextReset(now) {
  const d = new Date(now);
  d.setHours(RESET_HOUR, 0, 0, 0);
  // getDay(): 0=Sun … 6=Sat. Days forward to reach Saturday.
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7));
  // Already past this Saturday's 06:00 -> the one a week later.
  if (d.getTime() <= now) d.setDate(d.getDate() + 7);
  return d;
}

// Counts down the 168 hours between one Saturday 06:00 and the next. The time
// left is derived from the clock on every tick (never stored), so it starts
// over at 168:00:00 on its own the moment Saturday 06:00 arrives.
function remaining() {
  const now = Date.now();
  const next = nextReset(now);
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
        <span>Resets {left.resetsOn}, 6 AM</span>
      </div>
    </div>
  );
}
