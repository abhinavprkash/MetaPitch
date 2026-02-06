"""Generates mock Soccer/Blue Lock data into SQLite (data/metapitch.db).

Usage: python scripts/mock_soccer.py
"""

import os
import sqlite3
import numpy as np

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "metapitch.db")

def create_tables(conn: sqlite3.Connection):
    conn.executescript("""
        DROP TABLE IF EXISTS frames;
        DROP TABLE IF EXISTS plays;
        DROP TABLE IF EXISTS players;
        DROP TABLE IF EXISTS games;

        CREATE TABLE games (
            game_id INTEGER PRIMARY KEY,
            home_team TEXT,
            away_team TEXT,
            game_date TEXT NOT NULL,
            stadium TEXT
        );

        CREATE TABLE plays (
            game_id INTEGER NOT NULL,
            play_id INTEGER NOT NULL,
            description TEXT,
            frame_count INTEGER,
            PRIMARY KEY (game_id, play_id)
        );

        CREATE TABLE frames (
            game_id INTEGER NOT NULL,
            play_id INTEGER NOT NULL,
            frame_id INTEGER NOT NULL,
            nfl_id INTEGER, -- actually player_id
            x REAL NOT NULL,
            y REAL NOT NULL,
            vx REAL,
            vy REAL,
            orientation REAL,
            team TEXT,
            jersey_number INTEGER,
            display_name TEXT,
            event TEXT,
            source TEXT DEFAULT 'mock',
            PRIMARY KEY (game_id, play_id, frame_id, nfl_id)
        );
    """)

def generate_mock_data(conn: sqlite3.Connection):
    game_id = 999
    play_id = 1
    
    # 1. Create Game
    conn.execute(
        "INSERT INTO games (game_id, home_team, away_team, game_date, stadium) VALUES (?, ?, ?, ?, ?)",
        (game_id, "Blue Lock 11", "U-20 Japan", "2026-02-09", "Blue Lock Stadium")
    )

    # 2. Create Play
    conn.execute(
        "INSERT INTO plays (game_id, play_id, description, frame_count) VALUES (?, ?, ?, ?)",
        (game_id, play_id, "Isagi's Direct Shot Awakening", 100)
    )

    # 3. Generate Frames (Isagi Dribble & Shot)
    # Field: 105x68. Center: 52.5, 34.
    # Scenario: Isagi (Home #11) runs from midfield to box, assisted by Bachira (#8), vs Sae (#10).
    
    players = [
        {"id": 11, "name": "Isagi Yoichi", "team": "home", "number": 11, "start": [40, 34]},
        {"id": 8,  "name": "Bachira Meguru", "team": "home", "number": 8, "start": [45, 20]},
        {"id": 10, "name": "Sae Itoshi", "team": "away", "number": 10, "start": [60, 34]}, # Defender
        {"id": 1,  "name": "Gagamaru", "team": "home", "number": 1, "start": [5, 34]}, # GK
        {"id": 99, "name": "U-20 GK", "team": "away", "number": 1, "start": [100, 34]} # Opp GK
    ]

    # Ball starts with Bachira
    ball_pos = list(players[1]["start"])
    
    frames_data = []
    
    for t in range(100):
        frame_id = t + 1
        
        # Simple movement logic
        # Isagi runs towards goal (105, 34)
        isagi_target = [90, 34]
        
        # Bachira dribbles then passes at t=30
        if t < 30:
            target = [50, 25] # Dribble forward
        else:
            target = list(players[1]["start"]) # Stop
            
        # Update positions (very linear for mock)
        for p in players:
            # Linear interpolation for simplicity (mock physics)
            if p["id"] == 11: # Isagi
                 p["start"][0] += 0.4 # Run forward
            elif p["id"] == 8 and t < 30: # Bachira
                 p["start"][0] += 0.2
                 p["start"][1] += 0.2
            elif p["id"] == 10: # Sae tracks Isagi
                 if p["start"][0] > p["start"][0]:
                     p["start"][0] -= 0.1
            
            # Determine Event
            event = None
            if p["id"] == 8 and t == 30:
                event = "pass"
            
            # Save Frame
            conn.execute(
                """INSERT INTO frames (game_id, play_id, frame_id, nfl_id, x, y, vx, vy, orientation, team, jersey_number, display_name, event) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (game_id, play_id, frame_id, p["id"], p["start"][0], p["start"][1], 0, 0, 0, p["team"], p["number"], p["name"], event)
            )

        # Ball Logic
        ball_event = None
        
        # Calculate key positions for linear interpolation
        # Bachira Start (t=0): [45, 20]
        # Bachira moves [0.2, 0.2] per frame. At t=30: [45 + 30*0.2, 20 + 30*0.2] = [51, 26]
        pass_origin = [51, 26]
        
        # Isagi Start (t=0): [40, 34]
        # Isagi moves [0.4, 0] per frame. At t=50: [40 + 50*0.4, 34] = [60, 34]
        pass_destination = [60, 34]
        
        if t < 30: # With Bachira
            # Hardcoded relative to Bachira's current position to avoid lag
            # Bachira at t: [45 + t*0.2, 20 + t*0.2]
            bx = 45 + t * 0.2
            by = 20 + t * 0.2
            ball_pos = [bx + 1, by]
        elif t < 50: # Pass to Isagi (Linear Flight)
            if t == 30: ball_event = "pass"
            target_t = 50
            start_t = 30
            progress = (t - start_t) / (target_t - start_t)
            
            # Linear Interpolation
            ball_pos = [
                pass_origin[0] + (pass_destination[0] - pass_origin[0]) * progress,
                pass_origin[1] + (pass_destination[1] - pass_origin[1]) * progress
            ]
        else: # With Isagi
            if t == 50: ball_event = "received"
            # Isagi at t: [40 + t*0.4, 34]
            ix = 40 + t * 0.4
            iy = 34
            ball_pos = [ix + 1, iy]

        conn.execute(
            """INSERT INTO frames (game_id, play_id, frame_id, nfl_id, x, y, vx, vy, orientation, team, jersey_number, display_name, event) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (game_id, play_id, frame_id, -1, ball_pos[0], ball_pos[1], 0, 0, 0, "ball", 0, "Football", ball_event)
        )

    print(f"Generated {len(players) * 100} frames for Game {game_id}")

def main():
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    
    conn = sqlite3.connect(DB_PATH)
    try:
        create_tables(conn)
        generate_mock_data(conn)
        conn.commit()
    finally:
        conn.close()

if __name__ == "__main__":
    main()
