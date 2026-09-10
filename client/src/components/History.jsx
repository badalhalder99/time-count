import { Tile } from "./Tiles";
import { HOURS_PER_WEEK } from "../lib/constants.js";
import { formatHM } from "../lib/stats.js";
import { dayDate, longDate, parseYmd, pretty, today } from "../lib/dates.js";

function Chart({ last30, peak }) {
  return (
    <div className="chart-wrap">
      <div className="chart">
        {last30.map(({ day, n }, i) => (
          <div
            key={day}
            className={"col" + (n ? " has" : "")}
            title={`${pretty(day)}: ${n} hour${n === 1 ? "" : "s"}`}
          >
            <i style={{ height: n ? Math.max((n / peak) * 100, 8) + "%" : "3px" }} />
            {i % 7 === 0 && (
              <b>
                {parseYmd(day).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </b>
            )}
          </div>
        ))}
      </div>
      <div className="chart-caption">Last 30 days</div>
    </div>
  );
}

/** The banner row that opens each Saturday-to-Friday group in the table. */
function WeekHead({ week }) {
  return (
    <tr className="week-row">
      <td colSpan="4">
        <div className="week-head">
          <span className="week-range">
            {dayDate(week.start)} <span className="sep">–</span> {dayDate(week.end)}
          </span>
          <span className={"week-total" + (week.isCurrent ? " live" : "")}>
            {week.isCurrent ? "This week so far: " : "Week total: "}
            <strong>{formatHM(week.hours)}</strong> of {HOURS_PER_WEEK}h
            {week.isCurrent && <em> — in progress</em>}
            {!week.isCurrent && week.completed && <em> — completed</em>}
          </span>
        </div>
      </td>
    </tr>
  );
}

/** Rendered inside the right-hand Drawer, so it brings no card chrome of its own. */
export default function History({ s }) {
  const nothingYet = s.rows.length === 0 && s.undated === 0;

  return (
    <div className="history">
      <div className="history-head">
        <div className="hh-item">
          <span className="hh-label">Today</span>
          <span className="hh-value">{dayDate(today())}</span>
        </div>
        <div className="hh-item">
          <span className="hh-label">This week</span>
          <span className="hh-value">
            {dayDate(s.weekStart)} <span className="sep">–</span> {dayDate(s.weekEnd)}
          </span>
        </div>
        <div className="hh-item">
          <span className="hh-label">In hand each week</span>
          <span className="hh-value">
            {HOURS_PER_WEEK}h <span className="hh-sub">(24 × 7)</span>
          </span>
        </div>
      </div>

      <div className="tiles inset">
        <Tile value={s.days} label="Days studied" hint="days with hours logged" />
        <Tile value={s.best || "—"} label="Best day" hint="most in one day" />
        <Tile
          value={s.secondBestDay ? s.secondBestDay.n : "—"}
          label="2nd Best day"
          hint={
            s.secondBestDay
              ? `second most · ${longDate(s.secondBestDay.day)}`
              : "second most in one day"
          }
        />
        <Tile
          value={s.targetLabel}
          label="Deadline"
          hint={
            s.targetPassed
              ? "date has passed"
              : `${s.daysToTarget.toLocaleString()} days away`
          }
        />
      </div>

      <Chart last30={s.last30} peak={Math.max(s.best, 1)} />

      {nothingYet ? (
        <div className="empty">
          No hours logged yet. Click any number in the grid to cross it off — it
          gets stamped with today's date.
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Hours</th>
                <th>Crossed</th>
                <th className="right">Left after</th>
              </tr>
            </thead>

            {/* One tbody per week: the banner, then that week's days. */}
            {s.weeks.map((week) => (
              <tbody key={week.start}>
                <WeekHead week={week} />
                {week.rows.map((r) => (
                  <tr key={r.day}>
                    <td className="strong">{pretty(r.day)}</td>
                    <td>
                      <span className="badge">{r.n} h</span>
                    </td>
                    <td className="muted">
                      {r.hi === r.lo ? r.hi : `${r.hi} – ${r.lo}`}
                    </td>
                    <td className="right">{r.leftAfter}</td>
                  </tr>
                ))}
              </tbody>
            ))}

            {s.undated > 0 && (
              <tbody>
                <tr>
                  <td className="strong">Earlier</td>
                  <td>
                    <span className="badge subtle">{s.undated} h</span>
                  </td>
                  <td className="muted" colSpan="2">
                    before dates were tracked
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
