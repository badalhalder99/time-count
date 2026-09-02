function Ring({ percent }) {
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(percent, 100) / 100);

  return (
    <div className="ring-wrap">
      <svg className="ring" viewBox="0 0 130 130" role="img"
           aria-label={`${percent.toFixed(1)} percent complete`}>
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent-soft)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        <circle className="ring-track" cx="65" cy="65" r={r} />
        <circle
          className="ring-fill"
          cx="65"
          cy="65"
          r={r}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="ring-center">
        <span className="ring-num">{percent.toFixed(1)}%</span>
        <span className="ring-lbl">complete</span>
      </div>
    </div>
  );
}

export default function Hero({ s }) {
  return (
    <section className="card hero">
      <div className="hero-main">
        <div className="hero-eyebrow">Hours remaining</div>
        <div className="hero-count">{s.hoursLeft.toLocaleString()}</div>

        <div className="track" aria-hidden="true">
          <div className="track-fill" style={{ width: Math.max(s.percent, 0.4) + "%" }} />
        </div>
      </div>

      <Ring percent={s.percent} />
    </section>
  );
}
