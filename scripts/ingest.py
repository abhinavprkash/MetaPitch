"""Ingest BDB 2025 CSVs into SQLite (data/metapitch.db).

Usage: python scripts/ingest.py
"""

import os
import sqlite3
import numpy as np
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "nfl-big-data-bowl-2025")
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "metapitch.db")
CHUNK_SIZE = 500_000


def create_tables(conn: sqlite3.Connection):
    conn.executescript("""
        DROP TABLE IF EXISTS frames;
        DROP TABLE IF EXISTS plays;
        DROP TABLE IF EXISTS players;
        DROP TABLE IF EXISTS games;

        CREATE TABLE games (
            game_id INTEGER PRIMARY KEY,
            season INTEGER NOT NULL,
            week INTEGER NOT NULL,
            game_date TEXT NOT NULL,
            home_team TEXT NOT NULL,
            away_team TEXT NOT NULL,
            home_score INTEGER,
            away_score INTEGER,
            stadium TEXT
        );

        CREATE TABLE players (
            nfl_id INTEGER PRIMARY KEY,
            display_name TEXT NOT NULL,
            position TEXT,
            jersey_number INTEGER,
            height TEXT,
            weight INTEGER
        );

        CREATE TABLE plays (
            game_id INTEGER NOT NULL,
            play_id INTEGER NOT NULL,
            quarter INTEGER,
            down INTEGER,
            yards_to_go INTEGER,
            yardline_side TEXT,
            yardline_number INTEGER,
            play_direction TEXT,
            offense_team TEXT,
            defense_team TEXT,
            play_result INTEGER,
            description TEXT,
            frame_count INTEGER,
            PRIMARY KEY (game_id, play_id)
        );

        CREATE TABLE frames (
            game_id INTEGER NOT NULL,
            play_id INTEGER NOT NULL,
            frame_id INTEGER NOT NULL,
            nfl_id INTEGER,
            x REAL NOT NULL,
            y REAL NOT NULL,
            speed REAL,
            accel REAL,
            vx REAL,
            vy REAL,
            orientation REAL,
            direction REAL,
            team TEXT,
            jersey_number INTEGER,
            display_name TEXT,
            event TEXT,
            source TEXT DEFAULT 'kaggle',
            PRIMARY KEY (game_id, play_id, frame_id, nfl_id)
        );
    """)


def ingest_games(conn: sqlite3.Connection):
    print("Loading games.csv...")
    df = pd.read_csv(os.path.join(DATA_DIR, "games.csv"))
    df = df.rename(columns={
        "gameId": "game_id", "homeTeamAbbr": "home_team",
        "visitorTeamAbbr": "away_team", "gameDate": "game_date",
        "homeFinalScore": "home_score", "visitorFinalScore": "away_score",
    })
    df["stadium"] = None
    df[["game_id", "season", "week", "game_date", "home_team", "away_team",
        "home_score", "away_score", "stadium"]].to_sql(
        "games", conn, if_exists="append", index=False
    )
    print(f"  {len(df)} games")
    return df


def ingest_players(conn: sqlite3.Connection):
    print("Loading players.csv...")
    df = pd.read_csv(os.path.join(DATA_DIR, "players.csv"))
    df = df.rename(columns={"nflId": "nfl_id", "displayName": "display_name"})
    df[["nfl_id", "display_name", "position", "height", "weight"]].to_sql(
        "players", conn, if_exists="append", index=False
    )
    print(f"  {len(df)} players")


def ingest_plays(conn: sqlite3.Connection):
    print("Loading plays.csv...")
    df = pd.read_csv(os.path.join(DATA_DIR, "plays.csv"))
    df = df.rename(columns={
        "gameId": "game_id", "playId": "play_id",
        "yardsToGo": "yards_to_go", "yardlineSide": "yardline_side",
        "yardlineNumber": "yardline_number",
        "possessionTeam": "offense_team", "defensiveTeam": "defense_team",
        "yardsGained": "play_result", "playDescription": "description",
    })
    df["play_direction"] = None
    df["frame_count"] = None
    df[["game_id", "play_id", "quarter", "down", "yards_to_go",
        "yardline_side", "yardline_number", "play_direction",
        "offense_team", "defense_team", "play_result", "description",
        "frame_count"]].to_sql(
        "plays", conn, if_exists="append", index=False
    )
    print(f"  {len(df)} plays")


def ingest_tracking(conn: sqlite3.Connection, games_df: pd.DataFrame):
    # Build team lookup: gameId -> (home, away)
    team_map = {}
    for _, g in games_df.iterrows():
        team_map[g["game_id"]] = (g["home_team"], g["away_team"])

    total_rows = 0
    for week in range(1, 10):
        path = os.path.join(DATA_DIR, f"tracking_week_{week}.csv")
        if not os.path.exists(path):
            continue
        print(f"Loading tracking_week_{week}.csv...")
        week_rows = 0

        for chunk in pd.read_csv(path, chunksize=CHUNK_SIZE):
            # Vectorized processing
            is_left = chunk["playDirection"] == "left"

            # Normalize coords
            x = chunk["x"].copy()
            y = chunk["y"].copy()
            o = chunk["o"].fillna(0.0).copy()
            d = chunk["dir"].fillna(0.0).copy()

            x[is_left] = 120.0 - x[is_left]
            y[is_left] = 53.3 - y[is_left]
            o[is_left] = (o[is_left] + 180.0) % 360.0
            d[is_left] = (d[is_left] + 180.0) % 360.0

            # Compute velocity components
            s = chunk["s"].fillna(0.0)
            d_rad = np.radians(d)
            vx = s * np.cos(d_rad)
            vy = s * np.sin(d_rad)

            # Map club -> team (vectorized)
            home_teams = chunk["gameId"].map(lambda gid: team_map.get(gid, (None, None))[0])
            away_teams = chunk["gameId"].map(lambda gid: team_map.get(gid, (None, None))[1])
            team = pd.Series("unknown", index=chunk.index)
            team[chunk["club"] == "football"] = "ball"
            team[chunk["club"] == home_teams] = "home"
            team[chunk["club"] == away_teams] = "away"

            # Build output DataFrame
            out = pd.DataFrame({
                "game_id": chunk["gameId"],
                "play_id": chunk["playId"],
                "frame_id": chunk["frameId"],
                "nfl_id": chunk["nflId"],
                "x": x.round(2),
                "y": y.round(2),
                "speed": s.round(2),
                "accel": chunk["a"].fillna(0.0).round(2),
                "vx": vx.round(2),
                "vy": vy.round(2),
                "orientation": o.round(2),
                "direction": d.round(2),
                "team": team,
                "jersey_number": chunk["jerseyNumber"],
                "display_name": chunk["displayName"],
                "event": chunk["event"],
                "source": "kaggle",
            })

            # Use sentinel -1 for football (NULL breaks composite PK)
            out["nfl_id"] = out["nfl_id"].fillna(-1).astype(int)

            out.to_sql("frames", conn, if_exists="append", index=False)
            week_rows += len(out)

        print(f"  {week_rows:,} rows")
        total_rows += week_rows

    print(f"Total tracking rows: {total_rows:,}")


def backfill_and_index(conn: sqlite3.Connection):
    print("Backfilling frame_count...")
    conn.execute("""
        UPDATE plays SET frame_count = (
            SELECT MAX(frame_id) FROM frames
            WHERE frames.game_id = plays.game_id AND frames.play_id = plays.play_id
        )
    """)

    print("Creating indexes...")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_frames_play ON frames(game_id, play_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_frames_player ON frames(nfl_id, game_id)")


def main():
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print(f"Removed existing {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=OFF")
    conn.execute("PRAGMA cache_size=-2000000")

    try:
        create_tables(conn)
        games_df = ingest_games(conn)
        ingest_players(conn)
        ingest_plays(conn)
        conn.commit()

        ingest_tracking(conn, games_df)
        conn.commit()

        backfill_and_index(conn)
        conn.commit()

        # Stats
        count = conn.execute("SELECT COUNT(*) FROM frames").fetchone()[0]
        games = conn.execute("SELECT COUNT(*) FROM games").fetchone()[0]
        plays = conn.execute("SELECT COUNT(*) FROM plays").fetchone()[0]
        print(f"\nDone! {DB_PATH}")
        print(f"  {games} games, {plays} plays, {count:,} frame rows")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
