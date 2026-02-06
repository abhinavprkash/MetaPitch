# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MetaPitch** is an interactive NFL football analytics visualization tool. It renders Kaggle NFL tracking data as a futuristic holographic 3D scene (TRON/Blue Lock aesthetic) with AI-powered prediction via the Gemini API.

## Architecture (7 modules)

0. **App Shell** — Landing page with dataset browser (season → week → game → play). Manages global state: selected play, time index, camera pose, overlay toggles.
1. **Dataset Ingest & Indexing** — Python script (`scripts/ingest.py`) loads BDB 2025 CSVs into SQLite (`data/metapitch.db`). Normalizes coordinates, computes velocities, maps team membership.
2. **Holographic Renderer** — React Three Fiber scene (`frontend/src/scene/`): procedural grid field, player "totems" (wireframe capsules with laser tethers and floating holographic cards), ball. Bloom post-processing.
3. **Playback Engine** — Frame stepper in `frontend/src/App.tsx` with smooth interpolation. 10Hz data, 60fps rendering via lerp.
4. **Prediction Engine** — Mock forward-sim (`src/services/forward-sim/mock.ts`) with physics-based extrapolation. Gemini stub ready. Served via `POST /api/predict`.
5. **Stats/Scoring Module** — Per-frame headline stats in `frontend/src/hud/StatsHUD.tsx`.
6. **Video Extractor** — Mock (`src/services/video-extract/mock.ts`) returns realistic formation. Gemini stub ready. Served via `POST /api/extract`.
7. **Screenshot → Camera Pose** (stretch) — Not started.

## Project Structure

```
metapitch/
  contracts/data.md        # Canonical data format spec (READ THIS FIRST)
  src/services/            # Shared service layer (forward-sim, video-extract)
  server/                  # Express API server (better-sqlite3)
  frontend/                # React Three Fiber renderer (Vite + Zustand)
  scripts/                 # Python ingest pipeline
  data/                    # Raw CSVs + metapitch.db (gitignored)
```

## Data Contract

All data flows through the canonical format defined in `contracts/data.md`. Three producers (Kaggle ingest, forward-sim, video-extract) and four consumers (renderer, playback, prediction, stats) all use the same `PlayData` / `CanonicalPlay` shape.

## Dev Commands

```bash
# Ingest BDB 2025 data into SQLite (one-time, requires CSVs in data/nfl-big-data-bowl-2025/)
pip install -r scripts/requirements.txt
python scripts/ingest.py

# Start API server (port 3000)
cd server && npm install && npm run dev

# Start frontend (port 5173)
cd frontend && npm install && npm run dev

# Run service layer tests
npm test
```

## Visual Design Language

Reference `style.md` for full spec. Key constraints:
- Dark void background, emissive geometry only (no flat colors, no grass texture)
- Cyan/electric blue/white primary palette; subtle teal and faint orange accents
- Players are wireframe capsules with ground ring anchors, not dots or realistic humans
- Controlled bloom on edges/paths only — additive blending, no neon blobs
- UI elements float in 3D space, appear contextually — no dashboard panels
- All camera transitions eased, slow orbital motion at rest
- Aesthetic targets: Blue Lock (Ego POV), TRON grid, NASA/JPL wireframe schematics

## Key Files

- `contracts/data.md` — Canonical data format, API endpoints, coordinate system
- `idea.md` — Full project specification and module breakdown
- `style.md` — Visual design language and rendering intent
- `src/services/types.ts` — TypeScript types for canonical format
- `frontend/src/types.ts` — Frontend PlayData type (matches canonical)
- `frontend/src/store.ts` — Zustand state management
- `frontend/src/api.ts` — API fetch layer
