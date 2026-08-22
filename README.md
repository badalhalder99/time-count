# 2500 Hours

A reading countdown: 2500 numbered checkboxes, each one an hour. Cross them off and
the counter falls 2500 → 2499 → 2498 … → 0. Every hour is stamped with the date it
was finished, so the history panel shows how many hours you did on each day.

Progress lives in **MongoDB**, so the same count follows you across laptop and phone.

---

## Setup (about 10 minutes)

### 1. Create the database

1. Sign in to [MongoDB Atlas](https://cloud.mongodb.com) with your account.
2. **Create a free cluster** (the M0 tier is free forever — no card needed).
3. **Database Access** → *Add New Database User*. Pick a username and a strong
   password. Copy them somewhere safe.
4. **Network Access** → *Add IP Address* → **Allow access from anywhere**
   (`0.0.0.0/0`). This is required: Vercel's servers don't have fixed IPs.
5. **Database** → *Connect* → *Drivers* → copy the connection string. It looks like:

   ```
   mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

   Replace `<password>` in it with the real password from step 3.

> Treat this string like a password — it *is* one. Don't paste it into a chat,
> a screenshot, or a public repo.

### 2. Deploy to Vercel

```bash
cd C:\Users\badal\Desktop\Time-count
npm install
npx vercel
```

Accept the defaults. Then add the connection string as an environment variable —
either in the Vercel dashboard (**Project → Settings → Environment Variables**) or
from the terminal:

```bash
npx vercel env add MONGODB_URI
```

Paste the connection string when prompted, and select **all three** environments
(Production, Preview, Development). Then redeploy so the variable takes effect:

```bash
npx vercel --prod
```

Open the URL. The pill in the toolbar should read **"Connected to database"**.

### 3. Run it locally (optional)

```bash
copy .env.example .env.local     # then edit .env.local and put your real URI in it
npm install
npx vercel dev
```

Opening `index.html` by double-clicking still works, but with no server there is no
database — it falls back to this-device-only storage and the pill shows "Offline".

---

## How syncing behaves

- Every change saves instantly in the browser, then pushes to MongoDB about
  0.7 seconds later (so logging 5 hours is one database write, not five).
- **Offline still works.** Changes are kept locally and marked unsynced; the next
  time the page loads online, they're pushed up automatically.
- On load, if this device has unsynced changes they win; otherwise the database wins.
  So don't edit on two devices while one is offline — the last one to come online
  overwrites the other.
- The toolbar pill always tells you which state you're in: *Saved to database*,
  *Synced from database*, or *Offline — saved on this device*.

## Files

| File | What it does |
|---|---|
| `index.html` | The whole UI — grid, stats, date history, sync logic |
| `api/state.js` | Vercel serverless function: `GET` reads progress, `POST` saves it |
| `package.json` | Just the `mongodb` driver |
| `.env.example` | Template for local env vars — real values go in `.env.local` |

Data is one document in the `timecount` database, `progress` collection:

```js
{
  _id: "main",
  crossed: [0, 1, 2, ...],          // indexes; index 0 = hour 2500
  dates: { "0": "2026-08-22", ... }, // which day each hour was finished
  updatedAt: 1787417350972
}
```

## Note on privacy

The `/api/state` endpoint has no password on it. Anyone who knows your Vercel URL
could read or change your count. For a personal reading tracker that's usually fine,
but if you want it locked down, a shared-password gate is a small addition.
