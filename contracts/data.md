# MetaPitch — Canonical Data Contract (Soccer / Blue Lock)

This document defines the single data format for **Project Blue Lock**.

## Producers

1.  **Mock Soccer Engine** — Generates synthetic match scenarios (e.g. Blue Lock challenges).
2.  **Forward Simulation (Gemini)** — "MetaPitch" analysis predicting optimal paths.
3.  **Video Extractor** — Extracts player positions from soccer footage.

## Consumers

1.  **Holographic Renderer** — Three.js soccer pitch.
2.  **Playback Engine** — Steps through match frames.

---

## Coordinate System

-   **x**: 0–105 meters (Touchline length). Standard FIFA adaptation.
-   **y**: 0–68 meters (Goal line width).
-   **orientation** (`o`): 0–360 degrees.
-   **direction** (`dir`): 0–360 degrees.
-   **Frame rate**: 10 Hz.

**Note**: Origin (0,0) is the bottom-left corner of the pitch (corner flag).

---

## Canonical JSON: Play Data (Match Segment)

```jsonc
{
  "gameId": 1001,
  "playId": 1, // "Scenario ID"

  "meta": {
    "description": "Isagi's Direct Shot Challenge",
    "offense": "Blue Lock 11",
    "defense": "U-20 Japan"
  },

  "frameCount": 100,

  "events": {
    "15": "pass",
    "40": "received",
    "85": "shot",
    "95": "goal"
  },

  "players": {
    "11": { "name": "Isagi Yoichi", "team": "home", "number": 11, "role": "FW" },
    "10": { "name": "Sae Itoshi", "team": "away", "number": 10, "role": "MF" },
    "ball": { "name": "Ball", "team": "ball" }
  },

  "frames": [
    {
      "id": 1,
      "positions": {
        "11": [52.5, 34.0], // Center circle kickoff
        "ball": [52.5, 34.0]
      },
      "velocities": {
        "11": [0.0, 0.0]
      },
      "orientations": {
        "11": 90.0 // Facing opponent goal
      }
    }
  ],

  "source": "mock"
}
```

## SQLite Schema

```sql
CREATE TABLE games (
  game_id INTEGER PRIMARY KEY,
  home_team TEXT, away_team TEXT,
  game_date TEXT, stadium TEXT
);

CREATE TABLE plays (
  game_id INTEGER, play_id INTEGER,
  description TEXT, frame_count INTEGER,
  PRIMARY KEY (game_id, play_id)
);

CREATE TABLE frames (
  game_id INTEGER, play_id INTEGER, frame_id INTEGER,
  nfl_id INTEGER, -- Keeping column name for compatibility, really "player_id"
  x REAL, y REAL,
  vx REAL, vy REAL,
  orientation REAL,
  team TEXT,
  jersey_number INTEGER, display_name TEXT,
  event TEXT,
  source TEXT DEFAULT 'mock',
  PRIMARY KEY (game_id, play_id, frame_id, nfl_id)
);
```

