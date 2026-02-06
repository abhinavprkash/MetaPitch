# MetaPitch ⚽️

**"Devour# MetaPitch ⚽️

**"Devour the Field."**

MetaPitch is an AI-powered sports trajectory simulation and analysis platform.
A 3D Soccer Visualization and Analysis tool powered by Gemini 3. It uses "Metavision" to analyze player positions in real-time and predict the most "Egoistic" path to the goal.

## Features
- **3D Holographic Pitch**: Full FIFA-standard soccer field rendering.
- **Metavision Analysis**: Gemini 3.0 Pro/Flash predicts future player movements and scoring opportunities.
- **Blue Lock Scenarios**: Pre-loaded with iconic challenges (e.g., Isagi's Direct Shot).

## Prerequisites
- Node.js 18+
- Python 3.9+
- A Google Gemini API Key

## Quick Start

### 1. Setup Environment
Create a `.env` file in the root directory:
```bash
GEMINI_API_KEY=your_key_here
```

### 2. Generate Match Data
This creates the "Isagi Awakening" scenario in your local database.
```bash
python scripts/mock_soccer.py
```

### 3. Start the Server (Backend)
Open a new terminal:
```bash
cd server
npm install
npm run dev
```
_Runs on http://localhost:3000_

### 4. Start the Visualizer (Frontend)
Open another terminal:
```bash
cd frontend
npm install
npm run dev
```
_Opens http://localhost:5173_

## Usage
1. Open the frontend URL.
2. Select the **"Isagi's Direct Shot Awakening"** scenario.
3. Use the **Timeline** to scrub through the play.
4. Click **"Metavision"** (if implemented) or check the console logs to see Gemini analyzing the frame!
