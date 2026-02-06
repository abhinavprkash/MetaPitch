# MetaPitch System Design

## The Two User Actions

```
┌─────────────────────────────────────────────────────────┐
│                    USER ACTIONS                         │
│                                                         │
│  1. SIMULATE  — "What if I move this player here?"      │
│  2. ANALYZE   — "Break down this entire play for me"    │
└─────────────────────────────────────────────────────────┘
```

## SIMULATE Flow (drag → predict)

```
  User drags player to new position
           │
           ▼
  ┌─────────────────┐
  │  dragOverrides   │  store: { "player_42": [x, y] }
  │  (Zustand)       │
  └────────┬────────┘
           │ click SIMULATE
           ▼
  ┌─────────────────┐     POST /api/predict
  │  runSimulation() ├────────────────────────►  Express Server
  │  (store.ts:178)  │     { state (with drag   ┌──────────────┐
  └────────┬────────┘       overrides merged),   │ createForward│
           │                horizon: 20,         │ Simulator()  │
           │                simulator: engine }  └──────┬───────┘
           │                                            │
           │                              ┌─────────────┴─────────────┐
           │                              │                           │
           │                        simEngine='mock'           simEngine='gemini'
           │                              │                           │
           │                    ┌─────────▼────────┐     ┌────────────▼───────────┐
           │                    │ MockForwardSim    │     │ GeminiForwardSim       │
           │                    │                   │     │                        │
           │                    │ For each frame:   │     │ Sends player positions │
           │                    │  pos += vel * dt  │     │ + velocities to        │
           │                    │  vel *= friction  │     │ Gemini 3 Flash as JSON │
           │                    │  (30 frames)      │     │ in a prompt, parses    │
           │                    │                   │     │ JSON frames back       │
           │                    └─────────┬────────┘     └────────────┬───────────┘
           │                              │                           │
           │                              └─────────┬─────────────────┘
           │                                        │
           │                                        ▼
           │                               CanonicalPlay (predicted frames)
           │                                        │
           ▼                                        │
  ┌─────────────────┐◄─────────────────────────────┘
  │  predictedPlay   │
  │  (Zustand)       │  → Renderer shows predicted trajectories
  └─────────────────┘
```

**Result:** A single forward simulation from the current frame with your modified positions. You see where players would end up.

## ANALYZE Flow (belief engine)

```
  User clicks ANALYZE (while paused)
           │
           ▼
  ┌──────────────────┐     POST /api/stats
  │ runBeliefEngine() ├───────────────────────►  Express Server
  │ (store.ts:207)    │    { play, simulator,    ┌──────────────────┐
  └────────┬─────────┘      pauseFrame }         │ computePlayStats │
           │                                     │ (beliefEngine.ts)│
           │                                     └────────┬─────────┘
           │                                              │
           │         ┌────────────────────────────────────┘
           │         │
           │         │  FOR EACH FRAME in the play:
           │         │  ┌─────────────────────────────────────────────┐
           │         │  │                                             │
           │         │  │  1. Jitter all player positions (noise=0.3) │
           │         │  │  2. Run 20 forward sims (mock or gemini)    │
           │         │  │  3. Classify each sim's outcome:            │
           │         │  │     ball final X → loss/short/med/long/TD   │
           │         │  │  4. Build probability distribution          │
           │         │  │  5. Compute expected yards (avg across 20)  │
           │         │  │                                             │
           │         │  └─────────────────────────────────────────────┘
           │         │
           │         │  THEN between consecutive frames:
           │         │  ┌─────────────────────────────────────────────┐
           │         │  │  KL divergence between frame[i] and        │
           │         │  │  frame[i-1] distributions                  │
           │         │  │  → identifies "pivotal moments"            │
           │         │  │  → deltaPTd = change in TD probability     │
           │         │  └─────────────────────────────────────────────┘
           │         │
           │         │  FOR TOP 5 PIVOTAL FRAMES:
           │         │  ┌─────────────────────────────────────────────┐
           │         │  │  For each player:                          │
           │         │  │    Freeze player at frame[i-1] position    │
           │         │  │    Run 10 counterfactual sims              │
           │         │  │    KL(actual vs counterfactual)            │
           │         │  │    → attribution score per player          │
           │         │  │    "This player's move mattered most"      │
           │         │  └─────────────────────────────────────────────┘
           │         │
           │         ▼
           │    PlayStats {
           │      posteriors[]     ── per-frame: pTD, pTurnover, expYards, distribution
           │      deltas[]         ── per-frame: deltaPTd, klDivergence, isPivotal
           │      attributions[]   ── per-player-per-frame: who mattered
           │      playerStats[]    ── per-player: separation from nearest opponent
           │      pivotalFrames[]  ── top 5 frame IDs where outcome shifted most
           │      posteriorTrajectories[] ── mean path + variance at pause frame
           │    }
           │         │
           ▼         ▼
  ┌─────────────────────────┐
  │ beliefEngineResult      │
  │ playStats               │  → stored in Zustand
  └───────────┬─────────────┘
              │
     ┌────────┴─────────┐
     ▼                  ▼
  StatsHUD          StatsOverlay (3D)
  ┌──────────┐      ┌──────────────────┐
  │ BELIEF Δ │      │ Trajectory cones │
  │ TURNOVER │      │ Attribution viz  │
  │ EXP YARDS│      │ Pivotal markers  │
  │ TD PROB  │      └──────────────────┘
  └──────────┘
```

## How STATS Button Fits In

```
  STATS button = toggleStatsOverlay (boolean)

  StatsHUD always shows:
    EXP YARDS, TD PROB, BALL SPD, BALL DIST
    (these use static mock values OR belief engine posteriors if available)

  When statsOverlay=true AND belief engine has run:
    additionally shows: BELIEF Δ, TURNOVER
    (the per-frame posterior data from ANALYZE)
```

STATS doesn't compute anything — it just reveals extra columns that are only meaningful after ANALYZE has run.

## Mock vs Gemini

Both implement the same `ForwardSimulator` interface (one `predict()` method):

```
  ForwardSimulator.predict(input) → CanonicalPlay

  ┌────────────────────┐          ┌────────────────────────┐
  │ MockForwardSim     │          │ GeminiForwardSim       │
  │                    │          │                        │
  │ Physics extrapolat.│          │ Sends a prompt with    │
  │ pos += vel * 0.1   │          │ all player positions   │
  │ vel *= 0.97        │          │ + velocities as JSON   │
  │ (constant velocity │          │ to Gemini 3 Flash,     │
  │  + friction, no    │          │ asks it to predict     │
  │  player interact.) │          │ future frames,         │
  │                    │          │ parses JSON response   │
  └────────────────────┘          └────────────────────────┘
        Local, instant                 API call, slow
        Dumb but fast                  Smarter (in theory)
```

Both are used identically — the MOCK/GEMINI toggle in the controls just sets `simEngine` which gets passed to the server to pick which simulator to instantiate.

## Summary

| Feature | Triggers | Uses Forward Sim | Result |
|---------|----------|-----------------|--------|
| **SIMULATE** | Drag player + click | 1 sim run (20 frames forward) | Shows predicted trajectory |
| **ANALYZE** | Click button | 20 sims x every frame + 10 counterfactual sims x pivotal frames | Full play breakdown: posteriors, pivots, attributions |
| **STATS btn** | Toggle | None (display only) | Shows/hides belief engine columns in HUD |
| **Mock engine** | Default | `pos += vel*dt, vel *= friction` | Instant, toy physics |
| **Gemini engine** | Toggle | Gemini 3 Flash API call | Slower, LLM-predicted trajectories |
