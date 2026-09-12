# Ward-Level Disaster Risk Prioritization & Response Planning System
Team_044 | IBM BOB National Hackathon 2026 | Problem Statement 1

---

## Data Provenance

District: Patna, Bihar. 8 wards, GeoJSON polygons (bounding boxes).

| Field | Label | Source |
|---|---|---|
| `rainfall_24h_mm`, `rainfall_forecast_48h_mm` | Real/archived | IMD daily rainfall, National Water Data Portal — one real historical heavy-monsoon day |
| `elevation_m`, `low_elevation_susceptibility` | Derived from real data | SRTM 30m DEM, per ward centroid |
| `historical_flood_count_10y` | Derived/precomputed | Bhuvan National Flood Vulnerability Index (or NDEM) |
| `river_level_m` | Synthetic, threshold-grounded | Anchored to real Ganga-at-Patna danger level: **48.6m** |
| `population_at_risk` | Synthetic proxy from real data | District/block Census/OGD population, distributed proportionally across the 8 ward boundaries by area |
| `road_status`, `edges.json` | Synthetic scenario | Hand-built small graph (~8-10 nodes) |
| `image_ref` (observation) | Sample image | Not a real drone feed |

---

## Non-Goals

Never write: "predictive," "learns," "adapts," "real-time" (applied to river level or any synthetic field), "safest/fastest" unqualified. Never fabricate a lives-saved/response-time/efficiency percentage. Team-size ratio, λ, and Q threshold must be labeled illustrative, not calibrated, everywhere they appear.

This system is not:
- A flood predictor or competing with Google Flood Hub / IMD / SACHET on forecast accuracy.
- Claiming real drone hardware or operational-grade aerial detection — observation input works with a manually typed number; YOLO is optional enrichment only, never a dependency.
- Claiming live integration for Bhuvan, NDEM, NASA GDIS, Copernicus EMS, or NOAA — the system is schema-designed to extend to these sources; they are not live-integrated in this prototype.
- Claiming "safest/fastest" route — claiming hazard-aware, cost-minimizing route on a synthetic graph.
- Autonomously dispatching — every output is human-authorized decision support.
- A predictive system or a learning system — weights are hardcoded defaults, not trained or adapted over time.
- Implementing civilian evacuation routing — only rescue-team assignment and routing.

---

## API Contract

```
GET  /scenario                        → wards, edges, current state snapshot
GET  /hazard                          → H per ward + factor breakdown
GET  /priorities                      → H, V, Q, P, verification_flag per ward
GET  /assignments                     → team→ward table, team sizes, partial-coverage flags
GET  /route/{team_id}/{ward_id}       → route, status, hazard_exposure
POST /observation                     → triggers recompute, returns updated ward + audit event
POST /road-status                     → triggers recompute, returns updated wards + audit event
```

---

## How to Run

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs
