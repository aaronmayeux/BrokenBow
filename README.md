# BrokenBow

A standalone **PWA travel companion** for the Mayeux family trip to Broken Bow, OK — June 2026.
Installable to the home screen, works **fully offline** (the state park has no cell service), hosted on GitHub Pages.

**Live site:** https://aaronmayeux.github.io/BrokenBow/

---

## What it does

A vintage national-park field-guide style guide covering the whole trip: the drive up, the
4-night stay (itinerary + a votable activity menu), restaurants, provisions, and the scenic
route home — with a live countdown, an auto "today" view, live weather, packing & scavenger-hunt
checklists, one-tap map directions, and a day/night "campfire" theme.

## Structure

```
BrokenBow/
├── index.html              # markup / sections
├── css/
│   └── style.css           # field-guide theme, day/night, all styling
├── js/
│   ├── data.js             # ALL trip content (places, hours, coords, route) — edit here
│   ├── app.js              # countdown, voting, weather, spinner, checklists, today-view
│   └── sw-register.js      # service worker registration
├── sw.js                   # offline caching
├── manifest.webmanifest    # PWA install config
├── assets/
│   └── icons/              # 192 / 512 / maskable
└── README.md
```

> **Base path note:** this is a *project* Pages site served from `/BrokenBow/`, so all asset
> paths are relative and the manifest `start_url`/`scope` + service-worker scope account for the
> subpath. Don't switch to root-absolute (`/...`) paths.

## Run locally

It's static — any local server works (a `file://` open will break the service worker and fetches):

```bash
# from the repo root
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy (GitHub Pages)

1. Push to `main`.
2. Repo **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
3. Branch: `main` / `/ (root)` → **Save**.
4. Wait ~1 min; the site goes live at the URL above. (Pages will 404 until `index.html` exists.)

## Development

Built across sessions in a Claude project. `BUILD-PLAN.md` (in the project) is the living source
of truth — feature checklist, locked decisions, and the full content reference. Workflow is
audit-first: fetch the current file from `raw.githubusercontent.com`, audit, then regenerate the
full file. Edit trip content in `js/data.js`; logic in `js/app.js`; styling in `css/style.css`.

## Tech

Vanilla HTML/CSS/JS, no framework. Open-Meteo for weather (no API key). Google Maps deep links
for directions. `localStorage` for votes/checklists. No backend.
