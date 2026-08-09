# UFFC Gym — Member & Fee Manager

A responsive gym management app: member entry, membership plans, monthly fee
tracking with a 1-month renewal cycle, upcoming/overdue fee reminders, and
one-click WhatsApp reminders.

## Run locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## Build for production

```bash
npm run build
```

This creates a `dist/` folder with static HTML/CSS/JS you can host anywhere
(Netlify, Vercel, GitHub Pages, S3, your own server, etc.).

## Host it on GitHub Pages (free)

This project already includes a GitHub Actions workflow at
`.github/workflows/deploy.yml` that builds and deploys automatically on
every push to `main`.

1. Create a new empty repo on GitHub (no README/license, just empty).
2. In this folder, run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
   ```
3. On GitHub, go to your repo → **Settings → Pages** → under "Build and
   deployment", set **Source** to **GitHub Actions**.
4. Push again (or go to the **Actions** tab and re-run the workflow). After
   it finishes (~1 minute), your site is live at:
   `https://YOUR-USERNAME.github.io/YOUR-REPO/`

Every time you `git push` new changes to `main`, the site rebuilds and
redeploys automatically — no manual steps needed after the first setup.

## Data storage


Data (members, plans, payments) is saved in the browser's `localStorage`
via `src/storage.js`. This means:
- Data persists across reloads on the same browser/device.
- Data is NOT shared across devices or browsers — each admin's browser has
  its own local copy.
- If you need multiple staff/devices to see the same data, you'll need to
  swap `src/storage.js` for real API calls to a backend + database. The
  rest of the app (App.jsx) doesn't need to change — it only calls
  `storage.get(key)` and `storage.set(key, value)`.
