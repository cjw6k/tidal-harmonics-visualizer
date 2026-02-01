# Tidal Harmonics Visualizer

An interactive educational tool for exploring tidal science, harmonic analysis, and marine navigation planning. Built with React, Three.js, and real astronomical calculations.

**[Live Demo](https://cjw6k.github.io/tidal-harmonics-visualizer/)**

## What is this?

Tides aren't just "water goes up, water goes down." They're the result of a complex gravitational dance between Earth, Moon, and Sun—a dance that can be mathematically decomposed into dozens of harmonic constituents, each with its own amplitude, frequency, and phase.

This visualizer helps you understand and explore:

- **How tides actually work** — The gravitational forces, the bulges, the rotation
- **Harmonic analysis** — How we predict tides by summing sine waves (constituents)
- **Real-world applications** — Navigation safety, activity planning, marine operations

## Features

### 3D Visualization
Interactive Earth-Moon-Sun system showing real-time gravitational forces and tidal bulges. Watch how the Moon's position creates spring and neap tides.

### 100+ Interactive Tools

**Educational**
- Phasor diagrams showing constituent phase relationships
- Waveform decomposition — see how sine waves combine
- Doodson number explorer
- Interactive quizzes
- Comprehensive glossary

**Charts & Analysis**
- Real-time tide curves with constituent breakdown
- Frequency spectrum analysis
- Spring/neap calendars
- King tide predictions
- Historical extremes

**Navigation & Safety**
- Under-keel clearance calculator
- Bridge clearance calculator
- Grounding risk analyzer
- Port approach advisor
- Tidal stream atlas

**Activity Planning**
- Beach access windows
- Kayak launch planner
- Dive slate generator
- Surf conditions calculator
- Shellfish harvest timing
- Coastal hiking planner

**Professional Marine**
- Passage planner with tidal gates
- Docking window calculator
- Mooring line calculator
- Fuel consumption estimator
- Crew watch scheduler

### Keyboard Navigation
- `1-5` — Switch tabs
- `` ` `` — Toggle control panel
- `Ctrl+K` — Search tools
- `P` — Toggle phasor diagram
- `C` — Toggle tide curve
- `Space` — Pause/resume time
- `?` — Show all shortcuts

## Tech Stack

- **React 19** with TypeScript
- **Three.js** via React Three Fiber for 3D graphics
- **Recharts** for data visualization
- **astronomy-engine** for precise celestial calculations
- **Zustand** for state management
- **Tailwind CSS** for styling
- **Vite** with PWA support

## Getting Started

```bash
cd tidal-harmonics
npm install
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## The Science

Tidal prediction uses **harmonic analysis**, a technique developed in the 19th century. Each tidal constituent represents a specific astronomical cycle:

| Constituent | Period | Description |
|-------------|--------|-------------|
| M2 | 12.42 hrs | Principal lunar semidiurnal |
| S2 | 12.00 hrs | Principal solar semidiurnal |
| K1 | 23.93 hrs | Luni-solar diurnal |
| O1 | 25.82 hrs | Principal lunar diurnal |
| N2 | 12.66 hrs | Larger lunar elliptic |

The visualizer includes 37 constituents, covering the major astronomical cycles that influence tides worldwide.

### Doodson Numbers

Each constituent has a Doodson number encoding its relationship to six fundamental astronomical frequencies. The explorer lets you decode these numbers and understand what each constituent represents physically.

### Nodal Corrections

The Moon's orbit precesses over 18.6 years, causing long-term variations in tidal amplitudes. The nodal correction panel shows where we are in this cycle and how it affects predictions.

## Data Sources

Harmonic constants are derived from long-term tide gauge observations. The astronomy calculations use the VSOP87 and ELP/MPP02 theories for planetary and lunar positions.

## License

MIT

---

*"The tides are a clock that never stops, driven by the patient machinery of the solar system."*
