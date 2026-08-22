import { Tile } from "./Tiles";
import { pretty, parseYmd } from "../lib/dates.js";

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

/** Rendered inside the right-hand Drawer, so it brings no card chrome of its own. */
export default function History({ s }) {
  const nothingYet = s.rows.length === 0 && s.undated === 0;

  return (
    <div className="history">
      <div className="tiles inset">
        <Tile value={s.days} label="Days studied" hint="days with hours logged" />
        <Tile value={s.best || "—"} label="Best day" hint="most in one day" />
        <Tile
          value={s.eta}
          label="Projected finish"
          hint="at your current pace"
          accent={s.onTrack}
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
          No hours logged yet. Pick a date, set the hours, and press{" "}
          <strong>Log hours</strong>.
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
            <tbody>
              {s.rows.map((r) => (
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
              {s.undated > 0 && (
                <tr>
                  <td className="strong">Earlier</td>
                  <td>
                    <span className="badge subtle">{s.undated} h</span>
                  </td>
                  <td className="muted" colSpan="2">
                    before dates were tracked
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
