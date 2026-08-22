export default function Toolbar({
  date,
  setDate,
  amount,
  setAmount,
  onLog,
  onJump,
  showHistory,
  toggleHistory,
  canJump,
}) {
  return (
    <section className="card controls">
      <div className="field">
        <label htmlFor="logDate">Date</label>
        <input
          id="logDate"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="field narrow">
        <label htmlFor="logAmount">Hours</label>
        <input
          id="logAmount"
          type="number"
          min="1"
          max="2500"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onLog()}
        />
      </div>

      <div className="field grow">
        <span className="field-spacer" />
        <div className="btn-row">
          <button className="btn primary" onClick={onLog}>
            Log hours
          </button>
          {canJump && (
            <button className="btn ghost" onClick={onJump}>
              Jump to current
            </button>
          )}
          <button className="btn ghost" onClick={toggleHistory}>
            {showHistory ? "Hide history" : "Show history"}
          </button>
        </div>
      </div>

      <p className="controls-hint">
        Hours are stamped with the date above. Click any number to cross it off —
        click it again to undo.
      </p>
    </section>
  );
}
