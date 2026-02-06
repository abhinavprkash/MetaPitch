"""Quick 2D top-down field viz — browse all plays in a single game.

Controls:
  Space       - play/pause
  Left/Right  - prev/next play
  Up/Down     - speed up/slow down
"""

import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.animation import FuncAnimation
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "nfl-big-data-bowl-2025")

# Load dimension tables
games = pd.read_csv(os.path.join(DATA_DIR, "games.csv"))
plays_df = pd.read_csv(os.path.join(DATA_DIR, "plays.csv"))

# Load week 1 tracking
print("Loading tracking_week_1.csv...")
tracking = pd.read_csv(os.path.join(DATA_DIR, "tracking_week_1.csv"))

# Pick the first game in week 1
game_id = tracking["gameId"].unique()[0]
game_info = games[games["gameId"] == game_id].iloc[0]
home_team = game_info["homeTeamAbbr"]
away_team = game_info["visitorTeamAbbr"]
print(f"Game: {away_team} @ {home_team} (gameId={game_id})")

# Filter tracking to this game
game_tracking = tracking[tracking["gameId"] == game_id].copy()
game_tracking.sort_values(["playId", "frameId"], inplace=True)

# Get ordered play list
play_ids = sorted(game_tracking["playId"].unique())
game_plays = plays_df[(plays_df["gameId"] == game_id)].set_index("playId")
print(f"{len(play_ids)} plays in this game")

# State
state = {"play_idx": 0, "paused": False, "interval": 100}

# Pre-group frames by play
plays_data = {}
for pid in play_ids:
    pdf = game_tracking[game_tracking["playId"] == pid]
    plays_data[pid] = {fid: fdf for fid, fdf in pdf.groupby("frameId")}

def get_play():
    pid = play_ids[state["play_idx"]]
    frames = plays_data[pid]
    return pid, sorted(frames.keys()), frames

# Set up figure
fig, ax = plt.subplots(figsize=(14, 6.5))
fig.patch.set_facecolor("#1a1a1a")

COLORS = {home_team: "#ff4444", away_team: "#4488ff", "football": "#cc8833"}

def draw_field(ax):
    ax.clear()
    ax.set_facecolor("#2a5e2a")
    ax.set_xlim(-5, 125)
    ax.set_ylim(-5, 58.3)
    field = patches.Rectangle((0, 0), 120, 53.3, linewidth=2, edgecolor="white", facecolor="#2a5e2a")
    ax.add_patch(field)
    ez_left = patches.Rectangle((0, 0), 10, 53.3, facecolor="#1a4e1a", edgecolor="white", linewidth=1)
    ez_right = patches.Rectangle((110, 0), 10, 53.3, facecolor="#1a4e1a", edgecolor="white", linewidth=1)
    ax.add_patch(ez_left)
    ax.add_patch(ez_right)
    for yd in range(10, 111, 5):
        lw = 1.5 if (yd - 10) % 10 == 0 else 0.5
        ax.axvline(x=yd, color="white", linewidth=lw, alpha=0.6)
    for yd in range(10, 100, 10):
        num = yd if yd <= 50 else 100 - yd
        ax.text(yd + 10, 5, str(num), color="white", fontsize=10, ha="center", alpha=0.5)
        ax.text(yd + 10, 47, str(num), color="white", fontsize=10, ha="center", alpha=0.5)
    ax.set_aspect("equal")
    ax.set_xticks([])
    ax.set_yticks([])

artists = {"scatters": {}, "labels": [], "event_text": None, "info_text": None}

def init_play():
    draw_field(ax)
    artists["event_text"] = ax.text(60, 56, "", color="yellow", fontsize=11, ha="center", fontweight="bold")
    artists["info_text"] = ax.text(2, 56, "", color="white", fontsize=9)
    state["frame_counter"] = 0

init_play()

def animate(_):
    pid, frame_ids, frames = get_play()

    if state["paused"]:
        return

    fi = state["frame_counter"] % len(frame_ids)
    frame_id = frame_ids[fi]
    frame = frames[frame_id]

    # Clear old
    for lbl in artists["labels"]:
        lbl.remove()
    artists["labels"].clear()
    for s in artists["scatters"].values():
        s.remove()
    artists["scatters"].clear()

    for club in frame["club"].unique():
        cd = frame[frame["club"] == club]
        color = COLORS.get(club, "#ffffff")
        size = 40 if club != "football" else 20
        marker = "o" if club != "football" else "D"
        sc = ax.scatter(cd["x"], cd["y"], c=color, s=size, marker=marker, edgecolors="white", linewidths=0.5, zorder=5)
        artists["scatters"][club] = sc
        if club != "football":
            for _, row in cd.iterrows():
                lbl = ax.text(row["x"] + 0.8, row["y"] + 0.8, str(int(row["jerseyNumber"])),
                              color=color, fontsize=6, fontweight="bold", zorder=6)
                artists["labels"].append(lbl)

    events = frame[frame["event"].notna()]["event"].unique()
    event_str = ", ".join(events) if len(events) > 0 else ""
    artists["event_text"].set_text(event_str)

    # Play info
    desc = ""
    if pid in game_plays.index:
        pi = game_plays.loc[pid]
        desc = f"Q{pi.get('quarter', '?')} {pi.get('down', '?')}&{pi.get('yardsToGo', '?')}"
    artists["info_text"].set_text(f"Play {state['play_idx']+1}/{len(play_ids)} | frame {fi+1}/{len(frame_ids)} | {desc}")

    title = f"{away_team} @ {home_team} | [Space] pause  [</>] prev/next play"
    ax.set_title(title, color="white", fontsize=11)

    state["frame_counter"] += 1

def on_key(event):
    if event.key == " ":
        state["paused"] = not state["paused"]
    elif event.key == "right":
        state["play_idx"] = min(state["play_idx"] + 1, len(play_ids) - 1)
        state["frame_counter"] = 0
        init_play()
    elif event.key == "left":
        state["play_idx"] = max(state["play_idx"] - 1, 0)
        state["frame_counter"] = 0
        init_play()

fig.canvas.mpl_connect("key_press_event", on_key)

anim = FuncAnimation(fig, animate, interval=state["interval"], cache_frame_data=False)
plt.tight_layout()
plt.show()
