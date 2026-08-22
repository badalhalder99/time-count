const fs = require("fs");
const path = require("path");

// Load server/.env by absolute path, not relative to the current directory:
// `yarn start` runs from the repo root, where a bare config() would look for
// <root>/.env, find nothing, and silently start with no database.
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const { TOTAL, cleanCrossed, cleanDates } = require("./validate");

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;
const DOC_ID = "main";

/* ---------------- model ---------------- */

const progressSchema = new mongoose.Schema(
  {
    _id: { type: String, default: DOC_ID },
    crossed: { type: [Number], default: [] },
    dates: { type: mongoose.Schema.Types.Mixed, default: {} },
    updatedAt: { type: Number, default: 0 },
  },
  { versionKey: false, collection: "progress" }
);

const Progress = mongoose.model("Progress", progressSchema);

/* ---------------- app ---------------- */

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const dbUp = () => mongoose.connection.readyState === 1;

// Every /api route needs a live database, so fail loudly instead of
// pretending the save worked.
function requireDb(req, res, next) {
  if (dbUp()) return next();
  return res.status(503).json({
    error: "Database not connected",
    hint: MONGODB_URI
      ? "Check that the MongoDB server is reachable and the URI is correct."
      : "MONGODB_URI is not set. Copy server/.env.example to server/.env and fill it in.",
  });
}

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    database: dbUp() ? "connected" : "disconnected",
    total: TOTAL,
  });
});

app.get("/api/state", requireDb, async (req, res, next) => {
  try {
    const doc = await Progress.findById(DOC_ID).lean();
    res.json({
      crossed: doc?.crossed ?? [],
      dates: doc?.dates ?? {},
      updatedAt: doc?.updatedAt ?? 0,
    });
  } catch (err) {
    next(err);
  }
});

app.put("/api/state", requireDb, async (req, res, next) => {
  try {
    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({ error: "Expected a JSON object body" });
    }

    const crossed = cleanCrossed(body.crossed);
    const dates = cleanDates(body.dates);
    const updatedAt = Date.now();

    await Progress.findByIdAndUpdate(
      DOC_ID,
      { $set: { crossed, dates, updatedAt, total: TOTAL } },
      { upsert: true, new: true }
    );

    res.json({
      ok: true,
      updatedAt,
      hoursDone: crossed.length,
      hoursLeft: TOTAL - crossed.length,
    });
  } catch (err) {
    next(err);
  }
});

/* ------------- serve the built client in production ------------- */

const dist = path.join(__dirname, "..", "client", "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(dist, "index.html"));
  });
}

app.use((err, req, res, next) => {
  console.error("[api error]", err);
  res.status(500).json({ error: String(err.message || err) });
});

/* ---------------- boot ---------------- */

async function start() {
  if (!MONGODB_URI) {
    console.warn(
      "\n  MONGODB_URI is not set — the API will answer 503 until you add it.\n" +
        "  Copy server/.env.example to server/.env and paste your connection string.\n"
    );
  } else {
    try {
      await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
      console.log("  MongoDB connected");
    } catch (err) {
      // Keep serving so the UI can load and show a clear "database down" state.
      console.error("  MongoDB connection failed:", err.message);
    }
  }

  app.listen(PORT, () => {
    console.log(`  API listening on http://localhost:${PORT}`);
  });
}

if (require.main === module) start();

module.exports = { app, Progress };
