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

### Bug Fixes (v18 — 2026-03-17)

#### Config (`js/config.js`)
- **BSV pretest orientation**: all 3 back-server angles (BSV F/L/R) changed `'landscape'` → `'portrait'` (templates are actually portrait)
- **BSV packout orientation**: `BSV{g}F` and `BSV{g}AT{s}` in `_buildPackoutQueue()` changed `'landscape'` → `'portrait'`
- **Export quality**: added `exportQuality: 0.72` to `CONFIG.photo` — used for ZIP re-encoding to reduce file size
- **Photo filenames**: `generateFilename()` simplified to always return `{ID}.jpg` (PN/SN already appear in ZIP filename)

#### CSS (`css/styles.css`)
- **Landscape template fill**: added `#template-overlay img.template-rotated` rule that sets `width: calc(100% * 4/3)` / `height: calc(100% * 3/4)` before the 90° rotation, so the image fills the full 3:4 viewport instead of rendering smaller

#### Screens (`js/screens.js`)
- **`renderTemplateOverlay()`**: for landscape photos, removes `w-full h-full` Tailwind classes before adding `template-rotated` (the CSS rule above handles sizing)

#### Export (`js/export.js`)
- **`reencodeForExport()`**: new helper that re-encodes a portrait photo at `exportQuality` via canvas; used in `buildZip()` instead of raw `dataUrlToBlob()` to significantly reduce ZIP file size
- **`rotateImageToLandscape()`**: switched from `CONFIG.photo.quality` → `CONFIG.photo.exportQuality`
- **`downloadZip()`**: PWA-safe — tries `navigator.share({ files })` first (iOS Add-to-Home-Screen requires this); falls back to `<a>.click()` for desktop/non-PWA

#### App (`js/app.js`)
- **`startNewSession()`**: now calls `Camera.stop()` + `this.releaseWakeLock()` before resetting, preventing iOS camera stream conflicts when starting a new inspection mid-session

#### SW (`sw.js`)
- Bumped `CACHE_VERSION` from `v17` → `v18`

---

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways mid-task, STOP and re-plan before continuing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents to keep the main context window clean
- Offload file exploration, research, and parallel analysis to subagents
- For complex problems, use multiple focused subagents — one task per agent
- Prefer the Explore subagent for codebase searches; Plan subagent for architecture decisions

### 3. Self-Improvement Loop
- After ANY correction from the user: capture the pattern in memory (auto-memory system)
- Write rules that prevent the same mistake from recurring
- Review relevant memories at the start of each session

### 4. Verification Before Done
- Never consider a task complete without proving it works
- For export/ZIP changes: verify with actual photo count and file size
- For SW changes: confirm cache version bumped and hard-refresh performed
- Ask: "Would this pass a real FAI session without the user noticing any regression?"

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: step back and implement the clean solution
- Skip this for simple, obvious fixes — don't over-engineer a one-liner
- This is a lean PWA; keep helpers minimal and co-located with their use

### 6. Autonomous Bug Fixing
- When given a bug report: fix it. Don't ask for hand-holding.
- Check SW cache first (see Debugging Gotchas) before assuming logic is broken
- Diagnose from logs, errors, and observed behavior — then resolve
- Do not ask the user to reproduce steps you can reason about from the code

## Task Management

1. **Plan First** — outline the approach before touching any file
2. **Verify Plan** — check in on approach for anything architectural or risky
3. **Track Progress** — note which files changed and why at each step
4. **Explain Changes** — high-level summary at natural milestones (not after every line)
5. **Capture Lessons** — update memory after any user correction

## Core Principles

- **Simplicity First** — make every change as small as possible; minimal code impact
- **No Laziness** — find root causes; no temporary hacks; senior developer standards
- **Minimal Footprint** — only touch what's necessary; never introduce side-effect bugs
- **PWA Discipline** — every JS/CSS/HTML change requires a SW version bump and hard-refresh verification

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
