import { memo, useMemo } from "react";
import { TOTAL } from "../lib/constants.js";
import { pretty } from "../lib/dates.js";

const GROUP = 100; // hours per block

// memo keeps the other 2499 cells from re-rendering when one is clicked
const Cell = memo(function Cell({ index, hour, checked, date, flash, onToggle }) {
  const title = !checked
    ? `Hour ${hour} — not done yet`
    : date
      ? `Hour ${hour} — done on ${pretty(date)} (${date})`
      : `Hour ${hour} — done (no date recorded)`;

  return (
    <label
      className={"cell" + (checked ? " done" : "") + (flash ? " flash" : "")}
      title={title}
      data-index={index}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(index)}
        aria-label={`Hour ${hour}`}
      />
      <span className="cell-num">{hour}</span>
    </label>
  );
});

function Block({ start, crossed, dates, flashing, onToggle }) {
  const indexes = [];
  for (let i = start; i < Math.min(start + GROUP, TOTAL); i++) indexes.push(i);

  const doneInBlock = indexes.reduce((a, i) => a + (crossed.has(i) ? 1 : 0), 0);
  const complete = doneInBlock === indexes.length;

  return (
    <div className={"block" + (complete ? " complete" : "")}>
      <div className="block-head">
        <span className="block-range">
          {TOTAL - start} <span className="sep">–</span>{" "}
          {TOTAL - indexes[indexes.length - 1]}
        </span>
        <span className="block-progress">
          <span className="block-bar">
            <i style={{ width: (doneInBlock / indexes.length) * 100 + "%" }} />
          </span>
          <span className="block-count">
            {doneInBlock}/{indexes.length}
          </span>
        </span>
      </div>

      <div className="grid">
        {indexes.map((i) => (
          <Cell
            key={i}
            index={i}
            hour={TOTAL - i}
            checked={crossed.has(i)}
            date={dates[i]}
            flash={flashing.has(i)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}

export default function Grid({ crossed, dates, flashing, onToggle }) {
  const starts = useMemo(() => {
    const out = [];
    for (let i = 0; i < TOTAL; i += GROUP) out.push(i);
    return out;
  }, []);

  return (
    <div className="blocks">
      {starts.map((start) => (
        <Block
          key={start}
          start={start}
          crossed={crossed}
          dates={dates}
          flashing={flashing}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}
