const { MongoClient } = require("mongodb");

const TOTAL = 2500;
const DOC_ID = "main";
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "timecount";

// Serverless functions get re-used between invocations, so cache the client
// on the global object instead of reconnecting on every request.
let cache = global._mongoCache;
if (!cache) cache = global._mongoCache = { promise: null };

async function collection() {
  if (!uri) throw new Error("MONGODB_URI environment variable is not set");
  if (!cache.promise) {
    cache.promise = MongoClient.connect(uri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 8000,
    }).catch((err) => {
      cache.promise = null; // let the next request retry a failed connection
      throw err;
    });
  }
  const client = await cache.promise;
  return client.db(dbName).collection("progress");
}

function toIndex(v) {
  // Deliberately strict: Number(null) and Number('') are both 0, which would
  // silently cross off hour 2500. Only real numbers and digit strings count.
  if (typeof v === 'number') return Number.isInteger(v) ? v : NaN;
  if (typeof v === "string" && /^\d+$/.test(v)) return Number(v);
  return NaN;
}

function cleanCrossed(input) {
  if (!Array.isArray(input)) return [];
  const seen = new Set();
  for (const v of input) {
    const i = toIndex(v);
    if (Number.isInteger(i) && i >= 0 && i < TOTAL) seen.add(i);
  }
  return Array.from(seen).sort((a, b) => a - b);
}

function cleanDates(input) {
  const out = {};
  if (!input || typeof input !== "object" || Array.isArray(input)) return out;
  for (const key of Object.keys(input)) {
    const i = toIndex(key);
    const v = input[key];
    if (Number.isInteger(i) && i >= 0 && i < TOTAL &&
        typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
      out[i] = v;
    }
  }
  return out;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  try {
    const coll = await collection();

    if (req.method === "GET") {
      const doc = await coll.findOne({ _id: DOC_ID });
      return res.status(200).json({
        crossed: doc && doc.crossed ? doc.crossed : [],
        dates: doc && doc.dates ? doc.dates : {},
        updatedAt: doc && doc.updatedAt ? doc.updatedAt : 0,
      });
    }

    if (req.method === "POST" || req.method === "PUT") {
      let body = req.body;
      if (typeof body === "string") {
        try { body = JSON.parse(body); } catch (e) { body = null; }
      }
      if (!body || typeof body !== "object") {
        return res.status(400).json({ error: "Expected a JSON body" });
      }

      const crossed = cleanCrossed(body.crossed);
      const dates = cleanDates(body.dates);
      const updatedAt = Date.now();

      await coll.updateOne(
        { _id: DOC_ID },
        { $set: { crossed, dates, updatedAt, total: TOTAL } },
        { upsert: true }
      );

      return res.status(200).json({
        ok: true,
        updatedAt,
        hoursDone: crossed.length,
        hoursLeft: TOTAL - crossed.length,
      });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("state api error:", err);
    return res.status(500).json({ error: String(err.message || err) });
  }
};
