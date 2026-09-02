/**
 * The two navigation buttons, pinned to the top-right corner of the viewport
 * so they stay reachable no matter how far down the 2500-cell grid you are.
 */
export default function QuickActions({ onJump, canJump, showHistory, toggleHistory }) {
  return (
    <div className="quick-actions">
      {canJump && (
        <button className="btn ghost" onClick={onJump}>
          Jump to current
        </button>
      )}
      <button className="btn ghost" onClick={toggleHistory}>
        {showHistory ? "Hide history" : "Show history"}
      </button>
    </div>
  );
}
