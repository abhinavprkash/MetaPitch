okay so here is what I want to do:

as soon as you open up the page, you have the option to load up one of the game in our dataset -> leads into our holographic version of it. 

you will have the option to pause it at any time. we will use gemini api in the loop somehow to predict the next state of each player. and there will be some counter to calculate some statistics that we are interested in (maybe likelihood of scoring or somn idk)

another feature I want to be able to do is load up some random video or image of the field and then extract the player positions and insert it into our application.
- the process here will be you link a YouTube video to a game, we heavily prompt gemini to give it us in the format that we want. 

another stretch feature is a camera pan to rotate our model of the field to where a frame was possibly taken from (also camera angle prediction using gemini model or something)
- here we just upload a screenshot of the field.

lets keep the aesthetic part in the back of the mind for now. but lets outline the different pieces that are happening here.

vibe: egos digital screen of blue lock players and tron.png and vibe.png


generated plan:

### 0) App shell

* Landing page: dataset browser (season/week/game/play) + “Load demo play”
* State: selected play, current time index, camera pose, overlays toggles

### 1) Dataset ingest + indexing (prior work this can be local postgres, we will make it hosted later)

* Load Kaggle CSVs → build an index:

  * `gameId -> plays -> frames`
  * map `nflId -> player meta`
* Precompute: normalized field coordinates, per-frame velocities, possession/team masks

### 2) Holographic renderer

* Scene: field mesh + yard lines + endzones + coordinate grid
* Actors: player “totems” (capsules) + ball
* Overlays: trails, cones, labels/cards, heatmaps
* Controls: orbit camera, play/pause, scrub timeline, speed

### 3) Playback engine

* Clock: deterministic stepper over frames
* Interpolation: smooth between frames for visuals
* Events: snap/throw/catch/tackle markers (if available) to cue UI

### 4) Prediction engine (Gemini-in-the-loop)

Two modes:

* **Offline/fast mode (recommended):** local model (or heuristics) predicts next K frames.
* **Gemini mode (demo mode):** at pause time `t`, send a compact state summary → get predicted deltas.

Interface:

* Input: `state_t = {positions, velocities, roles, ball state, time}`
* Output: `pred_{t+1..t+h}` for each player + confidence

Rendering:

* Show predicted futures as dotted splines + “most likely” path as bright spline.

### 5) Stats / scoring module

* Define 1–2 headline stats you can compute every frame:

  * “Expected yards next 2s” or “Expected separation” or “Endzone reach probability”
* Live counter UI: updates during playback + highlights when prediction differs from ground truth.

IGNORE FOR NOW:

### 6) “Bring your own video” extractor

* Input: YouTube link (or uploaded clip)
* Pipeline:

  * Frame sampling
  * Player detection/tracking
  * Field homography (map pixels → field coords)
  * Output a synthetic `tracking.csv` compatible with your renderer
* Gemini role here should be *formatting / weak supervision*, not raw detection (you’ll get more reliability from CV).

### 7) Screenshot → camera pose (stretch)

* Input: screenshot of field
* Solve: estimate camera extrinsics (pose) so your 3D field matches that view
* Output: camera position + look-at + FOV; then you “snap” your hologram camera to it.

 When you say 'posterior mean as player     
     positions in belief engine mode' — do you    
      mean: after the 30 Monte Carlo sims per     
     frame, average all 30 predicted              
     trajectories and render those averaged       
     positions as a new playback you can scrub    
      through? → mean is the player pos,          
     variance is like the glow / unceratinity     
                                                  
                                                  
                                                  
     · For the 20 parallel Gemini calls — you     
     want to replace the current sequential 30    
      mock sims with 20 parallel Gemini calls,    
      each producing a trajectory, then           
     aggregate those into the posterior? →        
     yes, change the mock simulator ot follow     
     the same way, where one call returns the     
     whole trajectory of the horizon and then     
     call 20 of those in parallel. \              
     \                                            
     so we can sqap it out as needed              
                                                  
                                                  
                                                  
                                                  
                                                  
     · The lock icon — should it appear on the    
      3D player totems (in-scene) or as a HUD     
     indicator showing 'input locked during       
     belief computation'? → HUD indicator 
