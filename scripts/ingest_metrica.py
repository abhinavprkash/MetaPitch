
import os
import sqlite3
import pandas as pd
import requests
import io
import numpy as np

# Metrica Sample Game 2
GAME_ID = 2
URL_HOME = "https://raw.githubusercontent.com/metrica-sports/sample-data/master/data/Sample_Game_2/Sample_Game_2_RawTrackingData_Home_Team.csv"
URL_AWAY = "https://raw.githubusercontent.com/metrica-sports/sample-data/master/data/Sample_Game_2/Sample_Game_2_RawTrackingData_Away_Team.csv"

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "metapitch.db")
FIELD_LENGTH = 105
FIELD_WIDTH = 68

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
            source TEXT DEFAULT 'metrica',
            PRIMARY KEY (game_id, play_id, frame_id, nfl_id)
        );
    """)

def download_csv(url, filename):
    local_path = os.path.join(os.path.dirname(__file__), "..", "data", "metrica", filename)
    if os.path.exists(local_path):
        print(f"Loading local file: {local_path}")
        with open(local_path, 'r', encoding='utf-8') as f:
            content = f.read()
    else:
        print(f"Downloading {url}...")
        response = requests.get(url)
        response.raise_for_status()
        content = response.content.decode('utf-8')
        
    return pd.read_csv(io.StringIO(content), skiprows=2)

def transform_coords(x_norm, y_norm):
    if pd.isna(x_norm) or pd.isna(y_norm):
        return None, None
    return x_norm * FIELD_LENGTH, y_norm * FIELD_WIDTH

def ingest_metrica(conn):
    # 1. Initialize Tables (Schema)
    create_tables(conn)

    # 2. Insert Game
    conn.execute(
        "INSERT INTO games (game_id, home_team, away_team, game_date, stadium) VALUES (?, ?, ?, ?, ?)",
        (GAME_ID, "Home (Red)", "Away (Blue)", "2020-01-01", "Metrica Stadium")
    )
    
    # 3. Insert Play
    conn.execute(
        "INSERT INTO plays (game_id, play_id, description, frame_count) VALUES (?, ?, ?, ?)",
        (GAME_ID, 1, "Full Match Segment (Metrica Game 2)", 2000)
    )

    # 4. Process Tracking Data
    df_home = download_csv(URL_HOME, "Sample_Game_2_RawTrackingData_Home_Team.csv")
    df_away = download_csv(URL_AWAY, "Sample_Game_2_RawTrackingData_Away_Team.csv")
    
    def process_team(df, team_name, id_offset=0, skip_ball=False):
        df = df.drop(0)
        print(f"DEBUG: Columns for {team_name}: {list(df.columns[:10])}...")
        
        for idx, row in df.head(2000).iterrows():
            frame_id = int(row[1])
            cols = df.columns
            for i in range(3, len(cols), 2):
                col_name = cols[i]
                if "Ball" in col_name:
                    if skip_ball: continue
                    nfl_id = -1
                    name = "Ball"
                    team = "ball"
                    jersey = 0
                else:
                    # Parse "Player11" or "Player 11"
                    if col_name.startswith("Player"):
                        try:
                            # Remove "Player" and strip spaces to get jersey number
                            jersey_str = col_name.replace("Player", "").strip()
                            jersey = int(jersey_str)
                            nfl_id = jersey + id_offset
                            name = col_name
                            team = team_name
                        except ValueError:
                            continue # Skip if no valid number
                    else:
                        continue
                
                x_raw = row.iloc[i]
                y_raw = row.iloc[i+1]
                
                x, y = transform_coords(pd.to_numeric(x_raw, errors='coerce'), pd.to_numeric(y_raw, errors='coerce'))
                
                if x is not None:
                     conn.execute(
                        """INSERT OR IGNORE INTO frames (game_id, play_id, frame_id, nfl_id, x, y, vx, vy, orientation, team, jersey_number, display_name) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                        (GAME_ID, 1, frame_id, nfl_id, x, y, 0, 0, 0, team, jersey, name)
                    )
    
    print("Ingesting Home Team...")
    process_team(df_home, "home", id_offset=0, skip_ball=False)
    print("Ingesting Away Team...")
    process_team(df_away, "away", id_offset=100, skip_ball=True) # Skip ball for away to avoid duplicates
    
    conn.commit()
    print("Ingestion Complete.")

def main():
    conn = sqlite3.connect(DB_PATH)
    try:
        ingest_metrica(conn)
    finally:
        conn.close()

if __name__ == "__main__":
    main()
