# ⚡ ANALYZER — Kenya Political Intelligence Platform

A powerful web app for analyzing, simulating, and strategizing Kenyan elections at every level — MCA, MP, Women's Rep, Senator, Governor, to President.

## Features
- 🗳️ **Real IEBC Data** — 21.6M registered voters across 45,234 polling stations
- 🎯 **Election Simulator** — Simulate races at any level with multiple candidates
- 🔍 **Data Search** — Search by county, constituency, ward, or polling station
- 📊 **Polls Center** — Create shareable polls with geolocation restrictions
- 🤖 **AI Advisor** — Claude-powered political strategy advisor

## Deploy to Vercel

1. Fork or clone this repo
2. Push to GitHub
3. Import to [vercel.com](https://vercel.com)
4. Deploy — no environment variables needed

```bash
npm i -g vercel
vercel --prod
```

## Project Structure
```
analyzer/
├── index.html          # Main entry point
├── vercel.json         # Vercel config with caching
├── css/
│   └── main.css        # All styles
├── js/
│   ├── data.js         # Data loader (lazy-loads county chunks)
│   ├── utils.js        # Shared utilities
│   ├── charts.js       # Chart.js wrappers
│   ├── dashboard.js    # Dashboard page
│   ├── simulator.js    # Election simulator
│   ├── search.js       # Voter data search
│   ├── polls.js        # Polls center
│   ├── advisor.js      # AI advisor (Claude API)
│   └── app.js          # Router & init
└── data/
    ├── summary.json    # Fast-loading county/const/ward summary (~100KB)
    └── county_XXX.json # Per-county detailed data (lazy loaded)
```

## Data Source
IEBC 2022 General Election registered voters per polling station.
Total: 21,630,530 voters | 47 counties | 290 constituencies | 1,450 wards | 45,234 stations

## Notes
- The AI Advisor uses the Anthropic Claude API via claude.ai's built-in key
- Polls data is stored in localStorage (client-side only)
- All analytics are downloadable as PNG/PDF
