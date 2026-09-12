# RAIC — Ward-Level Disaster Risk Prioritization & Response System
**Team_044 | IBM BOB National Hackathon 2026 | Problem Statement 1**

Transform disaster management from reactive chaos to structured, transparent intelligence by fusing heterogeneous data streams into actionable, resource-constrained response strategies for district control rooms.

---

## 1. Data Provenance Table (Mandatory Verification)

| Field | Label | Source |
|---|---|---|
| `rainfall_24h_mm`, `rainfall_forecast_48h_mm` | Real/archived | IMD daily rainfall, National Water Data Portal — one real historical heavy-monsoon day used for the demo |
| `elevation_m`, `low_elevation_susceptibility` | Derived from real data | SRTM 30m DEM, computed per ward centroid |
| `historical_flood_count_10y` | Derived/precomputed | Bhuvan National Flood Vulnerability Index (or NDEM if faster to extract) |
| `river_level_m` | Synthetic, threshold-grounded | Simulated values, anchored to the real, documented Ganga-at-Patna danger level (48.6m) |
| `population_at_risk` | Synthetic proxy from real district data | District/block-level Census/OGD population figures distributed proportionally across the 8 synthetic ward boundaries by area — explicitly disclosed as a coarser-than-ward proxy, not ward-census-accurate |
| `road_status`, `edges.json` | Synthetic scenario | Hand-built small graph, not real road-network data |
| `image_ref` (observation endpoint) | Sample image | Not a real drone feed |

*Named-but-not-integrated dataset stack*: Bhuvan Spatial Flood Early Warning, NDEM, NASA GDIS, Copernicus EMS, USGS Earthquake, NOAA Natural Hazards — the system is schema-designed to extend to these sources; they are not live-integrated in this prototype build. USGS is a keyless free API noted as a feasible future extension for multi-hazard (earthquake) operations, out of scope for this build.

---

## 2. Explicit System Non-Goals (Mandatory Disclosures)

- Not competing with Google Flood Hub/IMD on forecast accuracy.
- Not claiming real drone hardware or operational-grade aerial detection — observation input works manually; a pretrained detector is optional enrichment.
- Not claiming live integration for any of the 6 named-but-uncited sources above.
- Not claiming "safest/fastest" — claiming hazard-aware, cost-minimizing routing on a synthetic graph.
- Not claiming full offline resilience — the backend scoring/routing engine runs on cached local data with no live API calls at inference; the demo frontend (Leaflet via CDN, map tiles) may still require network access — these are explicitly different claims, not conflated.
- Not fabricating any lives-saved, response-time-%, or efficiency-% figure, ever.
- Not autonomously dispatching — every output is human-authorized decision support.
- Team-size ratio, route-cost weight ($\lambda$), and $Q$ threshold are illustrative constants, disclosed as not empirically calibrated.
- `population_at_risk` is a district-data-derived proxy distributed across synthetic ward boundaries, not ward-level census data.
- Not a predictive system, not a learning system — weights are hardcoded defaults, not trained or adapted over time.
- No civilian evacuation routing is implemented — only rescue-team assignment and routing.

---

## 3. Technology Stack

- **Backend**: FastAPI (Python 3.8+), NetworkX (Dijkstra Pathfinding), Pydantic
- **Frontend**: React 18, Vite, Leaflet, Lucide Icons, Vanilla CSS Glassmorphism
- **Data Models**: Pre-computed GeoJSON & JSON schema stack

---

## 4. Installation & Quick Start

### Backend (Sibam's Server)
1. Navigate to repository root:
   ```bash
   cd IBM_Hack_team_044
   ```
2. Install Python dependencies:
   ```bash
   pip install -r backend/requirements.txt networkx uvicorn fastapi
   ```
3. Start the FastAPI server:
   ```bash
   python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
   ```
   * API root: `http://localhost:8000`
   * Swagger docs: `http://localhost:8000/docs`

### Frontend (Shayanna's Control Room UI)
1. Install Node dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Run Vite dev server:
   ```bash
   npm run dev
   ```
   * Control Room UI: `http://localhost:3000`

---

## 5. API Endpoints Contract

- `GET  /scenario` — Patna district wards, edges, current state snapshot
- `GET  /hazard` — Hazard Index ($H$) per ward (0-100) + factor breakdown
- `GET  /priorities` — Priority ($P$), Vulnerability ($V$), Confidence ($Q$), verification_flag per ward
- `GET  /assignments` — Team→ward assignment table, team sizes, partial-coverage flags
- `GET  /route/{team_id}/{ward_id}` — Hazard-aware route, status, hazard_exposure
- `POST /observation` — Live field observation input (`ward_id`, `detected_people_count`, etc.)
- `POST /road-status` — Road edge status update (`edge_id`, `status: "blocked" | "open"`)

---

## 6. Judge Demo Sequence (7 Sequential Demo Beats)

1. **Beat 1: Hazard Map & Factor Breakdown** (`/hazard`): Click non-rainiest high-risk ward (Ward 7). Display mandatory disclaimer.
2. **Beat 2: Vulnerability Contrast**: Side-by-side comparison (Ward 8 sparse vs Ward 2 PMCH Medical Hub).
3. **Beat 3: Confidence Proof**: Ward 3 bright amber `"VERIFY IMMEDIATELY"` flag (14h old river data).
4. **Beat 4: Priority & Assignments**: Ranked list, team sizing, `⚠ PARTIAL COVERAGE` alert banner.
5. **Beat 5: Hazard-Aware Routing**: Route map display, "Trigger Road Block" toggle, live reroute + Accessibility flag change, No-Path-Found decision framing.
6. **Beat 6: Manual Observation**: Submit typed count -> watch vulnerability, priority, team size, assignment, and audit log update live.
7. **Beat 7: Unified Audit Trail Feed**: Stream log showing `observation_update` & `road_status_update` events.
