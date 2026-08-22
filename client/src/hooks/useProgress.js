import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TOTAL } from "../lib/constants.js";
import { fetchState, saveState } from "../lib/api.js";

const CACHE = "hours2500_cache";
const DIRTY = "hours2500_dirty";
const LEGACY_DONE = "hours2500";        // old single-file version
const LEGACY_DATES = "hours2500_dates";

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE);
    if (raw) {
      const c = JSON.parse(raw);
      if (Array.isArray(c.crossed)) {
        return { crossed: c.crossed, dates: c.dates || {} };
      }
    }
    // Migrate progress made in the original single-file version.
    const legacy = JSON.parse(localStorage.getItem(LEGACY_DONE) || "null");
    if (Array.isArray(legacy) && legacy.length === TOTAL) {
      const crossed = [];
      legacy.forEach((on, i) => on && crossed.push(i));
      const dates = JSON.parse(localStorage.getItem(LEGACY_DATES) || "{}") || {};
      return { crossed, dates };
    }
  } catch {
    /* corrupt or unavailable storage — start clean */
  }
  return { crossed: [], dates: {} };
}

function writeCache(crossed, dates) {
  try {
    localStorage.setItem(CACHE, JSON.stringify({ crossed, dates }));
  } catch {
    /* private mode: the server is still the real store */
  }
}
const setDirty = (v) => {
  try {
    v ? localStorage.setItem(DIRTY, "1") : localStorage.removeItem(DIRTY);
  } catch {
    /* ignore */
  }
};
const isDirty = () => {
  try {
    return localStorage.getItem(DIRTY) === "1";
  } catch {
    return false;
  }
};

/**
 * Owns the progress state and keeps it in step with MongoDB.
 *
 * localStorage is only a cache: it paints instantly on load and holds edits
 * made while the server is unreachable. Unsynced local edits always win over
 * the database, so nothing typed offline is lost.
 */
export function useProgress() {
  const [state, setState] = useState(() => {
    const c = readCache();
    return { crossed: new Set(c.crossed), dates: c.dates };
  });
  const [sync, setSync] = useState({ status: "loading", message: "Connecting…" });

  const stateRef = useRef(state);
  stateRef.current = state;
  const timer = useRef(null);

  const push = useCallback(async () => {
    const { crossed, dates } = stateRef.current;
    setSync({ status: "saving", message: "Saving…" });
    try {
      await saveState([...crossed], dates);
      setDirty(false);
      setSync({ status: "ok", message: "Saved to database" });
    } catch (err) {
      setDirty(true);
      setSync({ status: "error", message: `Offline — saved on this device (${err.message})` });
    }
  }, []);

  const schedulePush = useCallback(() => {
    setSync({ status: "saving", message: "Saving…" });
    clearTimeout(timer.current);
    timer.current = setTimeout(push, 700);
  }, [push]);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isDirty()) {
        await push(); // local edits never reached the server — send them up
        return;
      }
      try {
        const remote = await fetchState();
        if (cancelled) return;
        const serverHas = remote.crossed.length > 0 || Object.keys(remote.dates).length > 0;
        if (serverHas) {
          setState({ crossed: new Set(remote.crossed), dates: remote.dates });
          writeCache(remote.crossed, remote.dates);
          setSync({ status: "ok", message: "Synced from database" });
        } else if (stateRef.current.crossed.size > 0) {
          await push(); // first run: seed the empty database from this device
        } else {
          setSync({ status: "ok", message: "Connected to database" });
        }
      } catch (err) {
        if (!cancelled) {
          setSync({ status: "error", message: `Offline — saved on this device (${err.message})` });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [push]);

  // Retry as soon as the network comes back
  useEffect(() => {
    const onOnline = () => isDirty() && push();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [push]);

  const commit = useCallback(
    (next) => {
      setState(next);
      writeCache([...next.crossed], next.dates);
      setDirty(true);
      schedulePush();
    },
    [schedulePush]
  );

  /** Toggle a single hour. `date` is stamped when crossing off. */
  const toggle = useCallback(
    (index, date) => {
      const crossed = new Set(stateRef.current.crossed);
      const dates = { ...stateRef.current.dates };
      if (crossed.has(index)) {
        crossed.delete(index);
        delete dates[index];
      } else {
        crossed.add(index);
        dates[index] = date;
      }
      commit({ crossed, dates });
    },
    [commit]
  );

  /** Cross off `count` hours, highest number first. Returns the indexes hit. */
  const logHours = useCallback(
    (count, date) => {
      const crossed = new Set(stateRef.current.crossed);
      const dates = { ...stateRef.current.dates };
      const touched = [];
      for (let i = 0; i < TOTAL && touched.length < count; i++) {
        if (!crossed.has(i)) {
          crossed.add(i);
          dates[i] = date;
          touched.push(i);
        }
      }
      if (touched.length) commit({ crossed, dates });
      return touched;
    },
    [commit]
  );

  const crossedList = useMemo(() => [...state.crossed], [state.crossed]);

  return { crossed: state.crossed, crossedList, dates: state.dates, sync, toggle, logHours };
}
