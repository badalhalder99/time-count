import { useCallback, useEffect, useMemo, useState } from "react";
import Drawer from "./components/Drawer";
import Grid from "./components/Grid";
import Hero from "./components/Hero";
import History from "./components/History";
import SyncPill from "./components/SyncPill";
import Tiles from "./components/Tiles";
import Toolbar from "./components/Toolbar";
import { useProgress } from "./hooks/useProgress";
import { TOTAL } from "./lib/constants.js";
import { today } from "./lib/dates.js";
import { summarize } from "./lib/stats.js";

export default function App() {
  const { crossed, crossedList, dates, sync, toggle, logHours } = useProgress();
  const [date, setDate] = useState(today);
  const [amount, setAmount] = useState("4");
  const [showHistory, setShowHistory] = useState(false);
  const [flashing, setFlashing] = useState(() => new Set());

  // stable identity: Drawer's effect depends on it
  const closeHistory = useCallback(() => setShowHistory(false), []);

  const s = useMemo(() => summarize(crossedList, dates), [crossedList, dates]);

  const firstOpen = useMemo(() => {
    for (let i = 0; i < TOTAL; i++) if (!crossed.has(i)) return i;
    return null;
  }, [crossed]);

  useEffect(() => {
    document.title = `${s.hoursLeft} hours left · 2500 Hours`;
  }, [s.hoursLeft]);

  const revealAndFlash = useCallback((indexes) => {
    if (!indexes.length) return;
    setFlashing(new Set(indexes));
    setTimeout(() => setFlashing(new Set()), 1100);
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-index="${indexes[0]}"]`);
      if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }, []);

  function handleLog() {
    const n = parseInt(amount, 10);
    if (!n || n < 1) return;
    revealAndFlash(logHours(n, date || today()));
  }

  function handleJump() {
    if (firstOpen === null) return;
    revealAndFlash([firstOpen]);
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="container topbar-inner">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                   strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </span>
            <div className="brand-text">
              <span className="brand-title">Reading Countdown</span>
              <span className="brand-sub">2,500 hours, one at a time</span>
            </div>
          </div>

          <div className="topbar-right">
            <div className="topbar-count">
              <strong>{s.hoursLeft.toLocaleString()}</strong>
              <span>left</span>
            </div>
            <SyncPill sync={sync} />
          </div>
        </div>
      </header>

      <main className="container">
        <Hero s={s} />
        <Tiles s={s} />
        <Toolbar
          date={date}
          setDate={setDate}
          amount={amount}
          setAmount={setAmount}
          onLog={handleLog}
          onJump={handleJump}
          canJump={firstOpen !== null}
          showHistory={showHistory}
          toggleHistory={() => setShowHistory((v) => !v)}
        />

        <Drawer
          open={showHistory}
          title="Progress by date"
          subtitle="Every hour you finish is stamped with its day."
          onClose={closeHistory}
        >
          <History s={s} />
        </Drawer>

        <section className="card hours">
          <header className="card-head">
            <div>
              <h2>All hours</h2>
              <p className="card-sub">
                Counting down from 2,500 in blocks of 100.
              </p>
            </div>
            <div className="legend">
              <span className="legend-item">
                <i className="swatch open" /> remaining
              </span>
              <span className="legend-item">
                <i className="swatch filled" /> done
              </span>
            </div>
          </header>

          <Grid
            crossed={crossed}
            dates={dates}
            flashing={flashing}
            onToggle={(i) => toggle(i, date || today())}
          />
        </section>

        <footer className="foot">
          Progress is saved to your MongoDB database.
        </footer>
      </main>
    </div>
  );
}
