# MetaPitch Architecture

## How It Works

```mermaid
flowchart LR
    A[User] --> B[3D Frontend]
    B --> C[Express API]
    C --> D[SQLite DB]
    C --> E[Gemini 3 AI]
    E --> F[Predictions]
    F --> B
    B --> G[Visualize on Pitch]
    
    style A fill:#00e5ff,stroke:#fff,color:#000
    style B fill:#1a1a2e,stroke:#00e5ff,color:#fff
    style C fill:#16213e,stroke:#00e5ff,color:#fff
    style D fill:#0f3460,stroke:#00e5ff,color:#fff
    style E fill:#4285f4,stroke:#fff,color:#fff
    style F fill:#34a853,stroke:#fff,color:#fff
    style G fill:#e94560,stroke:#fff,color:#fff
```

## Detailed Flow

```mermaid
flowchart TD
    Start([User Opens App]) --> Load[Load Match Data]
    Load --> Display[Display 3D Pitch]
    Display --> Scrub[Scrub Timeline]
    
    Scrub --> Meta{Click Analyze?}
    Meta -->|Yes| Predict[Send to Gemini AI]
    Predict --> Forecast[Predict Player Trajectories]
    Forecast --> Render[Render Predicted Paths]
    
    Meta -->|No| Stats{Click Stats?}
    Stats -->|Yes| Belief[Run Belief Engine]
    Belief --> Monte[Monte Carlo Simulations]
    Monte --> XG[Calculate xG & Goal Prob]
    XG --> Show[Show Stats Overlay]
    
    Stats -->|No| Scrub
    Render --> Scrub
    Show --> Scrub

    style Start fill:#00e5ff,stroke:#fff,color:#000
    style Load fill:#1a1a2e,stroke:#00e5ff,color:#fff
    style Display fill:#1a1a2e,stroke:#00e5ff,color:#fff
    style Scrub fill:#16213e,stroke:#00e5ff,color:#fff
    style Meta fill:#e94560,stroke:#fff,color:#fff
    style Stats fill:#e94560,stroke:#fff,color:#fff
    style Predict fill:#4285f4,stroke:#fff,color:#fff
    style Forecast fill:#4285f4,stroke:#fff,color:#fff
    style Render fill:#34a853,stroke:#fff,color:#fff
    style Belief fill:#9c27b0,stroke:#fff,color:#fff
    style Monte fill:#9c27b0,stroke:#fff,color:#fff
    style XG fill:#ff9800,stroke:#fff,color:#fff
    style Show fill:#34a853,stroke:#fff,color:#fff
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React + Three.js |
| Backend | Express + Node.js |
| Database | SQLite |
| AI | Google Gemini 3 |
