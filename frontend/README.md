# MIRA — Mirror Intelligent Routine Assistant

Frontend dashboard for an AI-powered smart mirror concept (college engineering
project, Batch Z4). Built with React, Vite, Tailwind CSS, Lucide icons, and
Recharts.

The dashboard talks to the FastAPI backend in `../backend`. The **Live AI
Analysis** panel opens the webcam (`getUserMedia`), captures a frame every
few seconds, POSTs it to `/skin-analysis/analyze` on the local backend, and
fans the result out to the skin-analysis, recommendation, expression and
wellness cards via a small event bus (`src/lib/analysisBus.js`). Frames are
drawn to an offscreen canvas and discarded — never uploaded or stored.
Hand tracking and the voice assistant are still illustrative. See
`src/services/mira.js` for the API layer.

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (typically `http://localhost:5173`).

To build a production bundle:

```bash
npm run build
npm run preview
```

## Project structure

```
src/
 ├── components/       Reusable UI pieces (Header, MirrorView, SkinAnalysis, …)
 ├── pages/             Dashboard, Skin Analysis, Wellness, Routine, Insights, Settings
 ├── data/mockData.js   Demo data driving every card and chart
 ├── services/mira.js   Placeholder API functions to replace with real backend calls
 ├── App.jsx            Top-level layout, navigation state
 └── main.jsx           React entry point
```

## Backend connection

`src/services/mira.js` calls `VITE_API_BASE_URL` (default
`http://localhost:8000/api/v1`). Start the backend first (see
`../backend/README.md`); if it isn't running the cards surface a
"backend unavailable" state.

## Notes on the design

- Dark glassmorphism UI with cyan/azure accents, built around a bento-style
  dashboard grid.
- The "Live AI Analysis" mirror panel shows the real (mirrored) webcam feed
  while running; the SVG reticle + scan-line are the HUD overlay. When
  stopped it falls back to the stylised landmark view.
- Skin analysis wording avoids diagnostic language ("Detected" / "Visible
  Feature" / Low-Moderate-High) with a disclaimer that it isn't a medical
  diagnosis.
- Responsive: horizontal tab navigation on desktop/tablet, bottom navigation
  on mobile, though the primary design target is a large smart-mirror
  display.
