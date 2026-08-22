export function Tile({ value, label, hint, accent }) {
  return (
    <div className="tile">
      <div className={"tile-value" + (accent ? " accent" : "")}>{value}</div>
      <div className="tile-label">{label}</div>
      {hint && <div className="tile-hint">{hint}</div>}
    </div>
  );
}

export default function Tiles({ s }) {
  return (
    <section className="tiles">
      <Tile
        value={s.todayHours}
        label="Today"
        hint={s.todayHours ? "logged" : "nothing yet"}
        accent={s.todayHours > 0}
      />
      <Tile
        value={s.streak}
        label="Day streak"
        hint={s.streak === 1 ? "day in a row" : "days in a row"}
      />
      <Tile
        value={s.days ? s.avg.toFixed(1) : "—"}
        label="Average"
        hint="hours per study day"
      />
      <Tile
        value={s.hoursLeft === 0 ? "Done" : s.requiredPerDay.toFixed(1)}
        label="Needed / day"
        hint={
          s.hoursLeft === 0
            ? "all 2,500 finished"
            : s.remainingToday > 0
              ? `${s.remainingToday} more today`
              : "today's target met"
        }
        accent={!s.onTrack && s.hoursLeft > 0}
      />
    </section>
  );
}
