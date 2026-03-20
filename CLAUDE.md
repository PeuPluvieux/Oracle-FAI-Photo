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

### Packout FAI

#### Config (`js/config.js`)
- `packoutTemplatePath: 'Test Sample Packout/Packout/Photo Template/'`
- `packoutAkbPhotos`: fixed set of 3 portrait photos (AKB1–3) — always taken
- `packoutDefaultPhotos`: 36 entries — AFR1-3, ARR1-3, SN, FRAT, PDU1-6, PDUAT1-2, BFRT/BFR1/BFR3/BRR2, CFR1-2/CFRTT, CRR1-3, CRS1/3/TT, CLS1, CSN, CCI, LB1-4
- `SESSION.components` arrays:
  - `pkServerGroupATs: [{ front: N, rear: N }, ...]` — one object per server group
  - `pkSwitchStackATs: [{ front: N, rear: N }, ...]` — one object per switch stack
  - `pkCustomComponents: [{ name, units, frontATs, rearATs }, ...]`
  - `pkAkPns` — count of accessory kit PN photos
- `_buildPackoutQueue()` — front-first ordering:
  1. Open rack fronts (AFR1-3)
  2. All server groups: `SV{g}` full view → `SV{g}AT{s}` front ATs
  3. All switch stacks: `SW{st}` full view → `SW{st}AT{sw}` front ATs
  4. Custom components: `CC{cx}U{u}` full view → `CC{cx}U{u}AT{s}` front ATs
  5. Open rack rears (ARR1-3)
  6. All server groups: `BSV{g}` full rear → `BSV{g}AT{s}` rear ATs
  7. All switch stacks: `BSW{st}` full rear → `BSW{st}AT{sw}` rear ATs
  8. Custom component rears: `BCC{cx}U{u}` full rear → `BCC{cx}U{u}AT{s}` rear ATs
  9. PDUs → pre-bag labels (SN, FRAT, LB1-4)
  10. AK PN photos → AKB1-3
  11. Bagged rack (BFRT, BFR1, BFR3, BRR2)
  12. Crated rack (CFR1-2, CFRTT, CRR1-3, CRS1/3/TT, CLS1, CSN, CCI)
- `calculateTotalPhotos()` correctly counts per-group/per-stack AT arrays + custom components
- `setStackOrientation()` regex: `/^(BSW|SW)(\d+)/`
- `fromJSON()` includes legacy migration from old global `pkServersPerGroupFront/Rear` keys
- `reset()` and `toJSON()` include all split keys + checkpoint flags

#### Checkpoint Gates (`SESSION` + `js/app.js`)
- `SESSION.checkpointBagging` — set `true` after user confirms Gate 2
- `SESSION.checkpointCarton` — set `true` after user confirms Gate 3
- **Gate 1 — Pre-start checklist** (`_showPackoutChecklist()`): shown before camera session begins; user must check all items before proceeding; confirm button disabled until all boxes checked
- **Gate 2 — Snapshot Video 2** (`checkSessionGates()`): fires when advancing to first `bagged_rack` photo; modal requires confirmation that Snapshot Video 2 is logged before plastic-wrap photos are unlocked
- **Gate 3 — Snapshot Video 3** (`checkSessionGates()`): fires when advancing to first `rack_in_carton` photo; modal requires confirmation that Snapshot Video 3 is logged before carton photos are unlocked
- Gates are persisted in `SESSION.toJSON()` / `fromJSON()` so they survive reload

#### Additional Packout Features
- **Already-captured banner**: `#already-captured-banner` shown when navigating to a photo slot that already has a capture; hidden on advance/retake
- **Save Now button**: `#save-now-btn` triggers `App.saveNow()` — forces an immediate IndexedDB flush and gives visual feedback
- **IndexedDB error toasts**: `App.showToast(message, type)` renders a fixed bottom toast (5 s) for storage errors and info messages
- **Switch orientation modal**: `#switch-orient-modal` prompts portrait/landscape when entering the first photo of each stack; applies via `SESSION.setStackOrientation()`

#### UI (`index.html`)
- Door branding checkbox **removed** from `#packout-options`
- Per-group/per-stack AT inputs rendered dynamically (not static split pairs)
- `#packout-checklist-modal` — Gate 1 overlay
- `#snapshot-gate-modal` with `#snapshot-gate-title` / `#snapshot-gate-body` — Gate 2 & 3 overlay
- `#switch-orient-modal` inside `#camera-viewport` (z-30) with portrait/landscape buttons

#### Screens (`js/screens.js`)
- `packoutComponentInputs` map uses all per-group array keys
- `_initSectionPills()`: packout → BEFORE / AFTER / LABELS / PARTS
- `_sectionForLocation(photo)`: uses `photo.section` for packout, `photo.location` for pretest
- `renderTemplateOverlay()`: routes to `packoutTemplatePath` when `SESSION.mode === 'packout'`
- `updateCameraUI()`: calls `App.checkSwitchOrientation()` and `App.checkSessionGates()` when in packout mode

#### App (`js/app.js`)
- Switch orientation modal button listeners wired
- `checkSwitchOrientation()`: triggers on `/^SW(\d+)$/` (first photo of each stack = full view)
- `confirmSwitchOrientation(orientation)`: applies orientation and re-renders
- `SESSION.switchOrientations = {}` reset on fresh `startCameraSession()`
- `_pendingStackNum` tracks which stack is awaiting orientation choice

### Bug Fixes (v18–v28 sprint)

#### Config (`js/config.js`)
- **BSV pretest orientation**: BSV F/L/R changed `'landscape'` → `'portrait'`
- **BSV packout orientation**: `BSV{g}F` and `BSV{g}AT{s}` changed `'landscape'` → `'portrait'`
- **Export quality**: `exportQuality: 0.85`, `maxExportDimension: 2400`
- **Photo filenames**: `generateFilename()` returns `{ID}.jpg` (PN/SN in ZIP filename)

#### CSS (`css/styles.css`)
- **Landscape template fill**: `#template-overlay img.template-rotated` sets `width: calc(100% * 4/3)` / `height: calc(100% * 3/4)` before 90° rotation so it fills the full 3:4 viewport

#### Screens (`js/screens.js`)
- **`renderTemplateOverlay()`**: for landscape photos, removes `w-full h-full` before adding `template-rotated`

#### Export (`js/export.js`)
- **`reencodeForExport()`**: re-encodes portrait photos at `exportQuality` via canvas before zipping
- **`rotateImageToLandscape()`**: uses `CONFIG.photo.exportQuality`
- **`downloadZip()`**: tries `navigator.share({ files })` first (iOS PWA), falls back to `<a>.click()`

#### App (`js/app.js`)
- **`startNewSession()`**: calls `Camera.stop()` + `this.releaseWakeLock()` before resetting to prevent iOS camera stream conflicts

### Current SW Version
`CACHE_VERSION = 'v33'` in `sw.js`

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

### App Version (APP_VERSION in js/config.js)
Format: V{Major}.{SW_build}.{Patch}
- SW_build: matches the SW cache version number (v31 → 31); bump with every feature/deploy
- Patch: bump for bug fixes within the same SW build (no SW bump needed)
- Major: bump for significant architectural overhauls only
Current: V2.33.0
Always update APP_VERSION (and SW version if applicable) before committing any change.

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
