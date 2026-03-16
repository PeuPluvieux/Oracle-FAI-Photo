# Oracle FAI Photos — Project Context for Claude

## Project Overview
Progressive Web App (PWA) for capturing FAI (First Article Inspection) photos.
Supports two modes: **Pretest FAI** and **Packout FAI**.

---

## Key Architecture

| File | Role |
|---|---|
| `js/config.js` | Central config + `SESSION` state. All photo queues built here. |
| `js/screens.js` | UI rendering, input maps, section pills, template overlay. |
| `js/app.js` | Event listeners, camera session, modal logic. |
| `index.html` | All HTML structure + Tailwind classes. |
| `js/storage.js` | IndexedDB persistence for photos. |
| `js/capture.js` | Camera capture logic. |

---

## Completed Work

### Pretest FAI
- Full photo queue via `_buildPretestQueue()` — front components first, then rear
- Component inputs: `switches`, `servers`, `corningEdge`, `cableLabels`, `cableBend`
- Template path: `Test Sample PRETEST v2/Template/`
- Section pills: FRONT / REAR / SIDES / LABELS

### Packout FAI (implemented across sessions)

#### Config (`js/config.js`)
- `packoutTemplatePath: 'Test Sample Packout/Packout/Photo Template/'`
- `packoutAkbPhotos`: fixed set of 3 portrait photos (AKB1.png, AKB2.png, AKB3.png) — always taken
- `packoutDefaultPhotos`: 36 real entries replacing old PK_* placeholders:
  - AFR1-3, ARR1-3 (open rack front/rear)
  - SN, FRAT (serial number + rack assy tag)
  - PDU1-6, PDUAT1-2 (PDU photos + assy tags)
  - BFR1, BFR3, BFRT, BRR2 (bagged rack)
  - CFR1-2, CFRTT, CRR1-3, CRS1/3/TT, CLS1 (crated rack)
  - CSN, CCI, LB1-4 (crate labels/info)
- `SESSION.components` split keys:
  - `pkServers`, `pkServersPerGroupFront`, `pkServersPerGroupRear`
  - `pkSwitches`, `pkSwitchesPerStackFront`, `pkSwitchesPerStackRear`
  - `pkAkPns`
- `_buildPackoutQueue()` — front-first ordering:
  1. All server groups: `SV{g}` full view → `SV{g}AT{s}` front ATs
  2. All switch stacks: `SW{st}` full view → `SW{st}AT{sw}` front ATs
  3. All server groups: `BSV{g}F` full rear view → `BSV{g}AT{s}` rear ATs
  4. All switch stacks: `BSW{st}AT{sw}` rear ATs
  5. AK PNs → AKB photos (always 3)
- `calculateTotalPhotos()` uses all split keys
- `setStackOrientation()` regex: `/^(BSW|SW)(\d+)/` (covers both full views and ATs)
- `fromJSON()` and `reset()` include all new split keys

#### UI (`index.html`)
- Door branding checkbox **removed** from `#packout-options`
- Old single inputs replaced with split pairs:
  - `qty-pk-servers-per-group-front` / `qty-pk-servers-per-group-rear`
  - `qty-pk-switches-per-stack-front` / `qty-pk-switches-per-stack-rear`
- `#switch-orient-modal` overlay added inside `#camera-viewport` (z-30)
  - Portrait / Landscape buttons
  - `#switch-orient-title` updated per stack number

#### Screens (`js/screens.js`)
- `packoutComponentInputs` map uses all 7 new split keys
- `_initSectionPills()`: packout → BEFORE / AFTER / LABELS / PARTS
- `_sectionForLocation(photo)`: uses `photo.section` for packout, `photo.location` for pretest
- `renderTemplateOverlay()`: routes to `packoutTemplatePath` when `SESSION.mode === 'packout'`
- `updateCameraUI()`: calls `App.checkSwitchOrientation()` when in packout mode

#### App (`js/app.js`)
- Switch orientation modal button listeners wired
- `checkSwitchOrientation()`: triggers on `/^SW(\d+)$/` (first photo of each stack = full view)
- `confirmSwitchOrientation(orientation)`: applies orientation and re-renders
- `SESSION.switchOrientations = {}` reset on fresh `startCameraSession()`
- `_pendingStackNum` property tracks which stack is awaiting orientation choice

---

## Pending / Known TODOs
- General/default packout photos sequence may change — user said guidelines will be updated
- `hasDoorBranding` JS logic still exists but UI is removed and it defaults to `false`

---

## Conventions
- Photo queue entries: `{ id, name, template, orientation, location, section }`
- `section` is used for pill grouping in packout; `location` is used in pretest
- Always keep pretest and packout logic parallel in structure
- Commit with `feat:` / `fix:` prefixes; co-author line required
- Do NOT include `server.py` in commits (local dev only)
- `Test Sample Packout/Packout/Photo Template/` PNG files ARE committed (needed for GitHub Pages)
- Do NOT commit the rest of `Test Sample Packout/` (reference photos, .pptx, .pdf — local assets only)

---

## Debugging Gotchas

### Service Worker Cache
This app uses a **cache-first service worker**. When JS/HTML changes are pushed:
- `CACHE_VERSION` in `sw.js` must be bumped to invalidate the old cache.
- After the new SW installs, the user must **refresh twice** (or hard-refresh once: Ctrl+Shift+R on desktop) before new files are actually served.
- **If a fix appears not to work even though the logic is correct, always ask: "Have you hard-refreshed since the last push?"** — this is the first thing to check before deeper debugging.
- On mobile: Settings → Safari/Chrome → Clear Website Data, or use remote DevTools.
- In DevTools: Application → Service Workers → Update → Skip Waiting → refresh page.
