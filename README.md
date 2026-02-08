# MetaPitch ⚽️

**"Devour the Field."**

MetaPitch is an AI-powered sports trajectory simulation and analysis platform. It is a 3D Soccer Visualization and Analysis tool powered by Gemini 3. It uses "MetaPitch" to analyze player positions in real-time and predict the most "Egoistic" path to the goal.

## Features
- **3D Holographic Pitch**: Full FIFA-standard soccer field rendering.
- **MetaPitch Analysis**: Gemini 3.0 Pro/Flash predicts future player movements and scoring opportunities.
- **Blue Lock Scenarios**: Pre-loaded with iconic challenges (e.g., Isagi's Direct Shot).

## Prerequisites
- Node.js 20+
- A Google Gemini API Key

## Quick Start (Development)

### 1. Setup Environment
Create a `.env` file in the root directory:
```bash
GEMINI_API_KEY=your_key_here
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Server (Backend)
```bash
cd server
npm run dev
```
_Runs on http://localhost:3000_

### 4. Start the Visualizer (Frontend)
Open another terminal:
```bash
cd frontend
npm run dev
```
_Opens http://localhost:5173_

---

## Production Deployment

MetaPitch is set up to deploy as a **single Node app**: the backend serves the built Vite frontend. One service, one URL.

### Option 1: Render (Easiest)

1. Push repo to GitHub (do **not** commit `node_modules/` or `.env`)
2. In Render: **New Web Service** → connect repo
3. Configure:
   - **Runtime**: Node 20
   - **Build Command**:
     ```bash
     npm ci && npm --workspace server run build && npm --workspace frontend run build
     ```
   - **Start Command**:
     ```bash
     node server/dist/index.js
     ```
4. Add environment variables:
   - `GEMINI_API_KEY` = your key
5. Deploy and open the service URL

### Option 2: Docker

Build and run locally or on any container host:

```bash
docker build -t metapitch .
docker run -p 3000:3000 -e GEMINI_API_KEY=your_key_here metapitch
```

### Option 3: VM Deploy (DigitalOcean, GCP, etc.)

Use the included deploy script:

```bash
sudo bash deploy/deploy.sh
```

Then add your `GEMINI_API_KEY` to `/home/metapitch/metapitch/.env`.

Check status:
```bash
sudo systemctl status metapitch
sudo journalctl -u metapitch -f
```

### Option 4: Split Deploy (Frontend CDN + Backend)

If you want separate scaling or a CDN-first frontend:

**Backend** (Render/Railway):
- Build: `npm ci && npm --workspace server run build`
- Start: `node server/dist/index.js`
- Env: `GEMINI_API_KEY`

**Frontend** (Vercel):
- Build: `npm ci && npm --workspace frontend run build`
- Set `VITE_API_URL` = `https://<your-backend-domain>`

---

## Usage
1. Open the frontend URL
2. Select the **"Isagi's Direct Shot Awakening"** scenario
3. Use the **Timeline** to scrub through the play
4. Click **"MetaPitch"** to see Gemini analyzing the frame!
