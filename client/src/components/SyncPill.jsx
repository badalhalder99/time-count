export default function SyncPill({ sync }) {
  const kind =
    sync.status === "ok" ? "ok" : sync.status === "error" ? "off" : "busy";

  const title =
    sync.status === "error"
      ? "Your progress is safe in this browser, but it is not reaching the database."
      : sync.message;

  // The full message is useful but long; keep the pill tight and put the
  // detail in the tooltip.
  const short =
    sync.status === "error"
      ? "Offline"
      : sync.status === "ok"
        ? "Saved"
        : sync.status === "saving"
          ? "Saving"
          : "Connecting";

  return (
    <span className={"pill " + kind} title={title}>
      <i />
      <span className="pill-short">{short}</span>
      <span className="pill-full">{sync.message}</span>
    </span>
  );
}
