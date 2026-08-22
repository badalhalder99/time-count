# 2500 Hours

A reading countdown: 2500 numbered checkboxes, each one an hour. Cross them off and
the counter falls 2500 → 2499 → 2498 … → 0. Every hour is stamped with the day it
was finished, so you can see how many hours you did on each date.

**React (Vite) + Express + MongoDB.** Progress lives in the database, so the same
count follows you across laptop and phone.

---

## Quick start

Uses **yarn workspaces** — one install covers both the client and the server.

```bash
yarn install
```

Then create `server/.env` with your database connection:

```bash
copy server\.env.example server\.env
```

Open `server/.env` and set `MONGODB_URI` (see below). Then:

```bash
yarn dev                   # Express on :4000, React on :5173
```

Open **http://localhost:5173**.

### Getting a MONGODB_URI

**Option A — MongoDB Atlas (free, works from anywhere):**

1. Sign in to [MongoDB Atlas](https://cloud.mongodb.com) and create a free **M0** cluster.
2. **Database Access** → add a user with a password.
3. **Network Access** → allow your IP (or `0.0.0.0/0` if you'll deploy to a host
   with changing IPs).
4. **Database → Connect → Drivers** → copy the string and put the real password in it:
   ```
   MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/timecount?retryWrites=true&w=majority
   ```

**Option B — MongoDB running on your own machine:**

```
MONGODB_URI=mongodb://127.0.0.1:27017/timecount
```

> The URI contains a password. `server/.env` is git-ignored — keep it that way, and
> don't paste the string into chats, screenshots, or issues.

---

## Production

```bash
yarn build                 # builds the React app into client/dist
yarn start                 # Express serves the API *and* the built app on :4000
```

One process, one port — visit http://localhost:4000.

---

## How it works

```
client/                    React app (Vite)
  src/
    App.jsx                page layout, log action, flash + scroll
    components/
      Grid.jsx             2500 memoised checkbox cells
      Stats.jsx            hours left / done / percent / today / streak
      History.jsx          KPIs, 30-day bar chart, per-day table
      Toolbar.jsx          date picker, hours box, buttons
      SyncPill.jsx         database connection indicator
    hooks/useProgress.js   state + MongoDB sync + offline cache
    lib/
      api.js               fetch wrappers for /api/state
      dates.js             local-time date helpers
      stats.js             grouping, streak, averages, projection
      constants.js         TOTAL = 2500

server/
  index.js                 Express app, Mongoose model, static hosting
  validate.js              strict input sanitising
  .env.example             template for your connection string

scripts/
  dev.js                   starts API + client (spawns node directly, no shell)
  build.js                 builds the client (same, no shell)
```

> **Why the custom scripts?** Tools like `concurrently` launch processes through
> `cmd.exe`. On Windows machines where `C:\Windows\System32` is missing from
> PATH, that fails with `spawn cmd.exe ENOENT`. These scripts spawn `node`
> directly with absolute paths, so there is no shell to resolve.

### The API

| Method | Route | Does |
|---|---|---|
| `GET` | `/api/health` | Reports whether the database is connected |
| `GET` | `/api/state` | Returns `{ crossed, dates, updatedAt }` |
| `PUT` | `/api/state` | Saves the whole progress document |

All progress is one document in the `progress` collection:

```js
{
  _id: "main",
  crossed: [0, 1, 2, ...],           // indexes; index 0 = hour 2500
  dates: { "0": "2026-08-22", ... },  // the day each hour was finished
  updatedAt: 1787418207252
}
```

### Syncing rules

- Changes save to the browser instantly, then push to MongoDB ~0.7s later, so
  logging 5 hours is one database write instead of five.
- **Offline still works.** Edits are kept locally and flagged unsynced; they're
  pushed automatically when the page next loads online, or when the network returns.
- On load, unsynced local edits win; otherwise the database wins. So don't edit on
  two devices while one is offline — the last to reconnect overwrites the other.
- The pill in the toolbar always shows the current state: *Saved to database*,
  *Synced from database*, or *Offline — saved on this device*.
- If you used the earlier single-file version, that progress is migrated out of
  `localStorage` on first load and pushed up to the database.

### A note on access

`/api/state` has no authentication. On `localhost` that's fine; if you host it
publicly, anyone with the URL can read or change your count. Worth adding a
password gate before deploying it to the open internet.
