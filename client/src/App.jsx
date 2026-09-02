import { useCallback, useEffect, useMemo, useState } from "react";
import Countdown from "./components/Countdown";
import Drawer from "./components/Drawer";
import Grid from "./components/Grid";
import Hero from "./components/Hero";
import History from "./components/History";
import QuickActions from "./components/QuickActions";
import { useProgress } from "./hooks/useProgress";
import { TOTAL } from "./lib/constants.js";
import { today } from "./lib/dates.js";
import { summarize } from "./lib/stats.js";

export default function App() {
  const { crossed, crossedList, dates, toggle } = useProgress();
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

  function handleJump() {
    if (firstOpen === null) return;
    revealAndFlash([firstOpen]);
  }

  return (
    <div className="app">
      <QuickActions
        onJump={handleJump}
        canJump={firstOpen !== null}
        showHistory={showHistory}
        toggleHistory={() => setShowHistory((v) => !v)}
      />

      <main className="container">
        <Hero s={s} />
        <Countdown />

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

          {/* No date picker any more — crossing a cell off stamps it today. */}
          <Grid
            crossed={crossed}
            dates={dates}
            flashing={flashing}
            onToggle={(i) => toggle(i, today())}
          />
        </section>

        <footer className="foot">
          Progress is saved to your MongoDB database.
        </footer>
      </main>
    </div>
  );
}
