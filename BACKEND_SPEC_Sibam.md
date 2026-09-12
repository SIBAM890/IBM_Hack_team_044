# BACKEND SPEC — Team_044, IBM BOB National Hackathon 2026, PS1
**Owner: Sibam. Scope: everything except UI rendering.**
This is your slice of the locked Master PRD. Shayanna's frontend spec calls the
endpoints you build here — treat the API contract in §6 as a hard interface,
don't change field names without telling her.

---

## 1. Your responsibility boundary

You own: data prep, all four engines (Hazard, Vulnerability+Confidence,
Priority+Assignment, Routing), the observation/road-status endpoints, the audit
trail, and the API layer.

You do NOT own: map rendering, tables, UI labels/copy, the pitch deck. Shayanna
owns everything the judge visually sees — you just need every field she needs
to exist in your JSON responses, correctly.

---

## 2. Data prep (before 2:00 PM — do this first, alone)

District: Patna, Bihar. 8 wards, GeoJSON polygons (bounding boxes are fine).

| Field | Label | Source |
|---|---|---|
| `rainfall_24h_mm`, `rainfall_forecast_48h_mm` | Real/archived | IMD daily rainfall, National Water Data Portal — one real historical heavy-monsoon day |
| `elevation_m`, `low_elevation_susceptibility` | Derived from real data | SRTM 30m DEM, per ward centroid |
| `historical_flood_count_10y` | Derived/precomputed | Bhuvan National Flood Vulnerability Index (or NDEM) |
| `river_level_m` | Synthetic, threshold-grounded | Anchored to real Ganga-at-Patna danger level: **48.6m** |
| `population_at_risk` | Synthetic proxy from real data | District/block Census/OGD population, distributed proportionally across the 8 ward boundaries by area |
| `road_status`, `edges.json` | Synthetic scenario | Hand-built small graph (~8-10 nodes) |
| `image_ref` (observation) | Sample image | Not a real drone feed |

**Mandatory dataset condition:** at least one ward (call it Ward 7) must rank
high in hazard WITHOUT being the rainiest ward — driven by river-level + low
elevation + historical frequency instead. Build this into the data on purpose,
don't leave it to chance — it's a required demo beat.

Save everything to `/data/wards.json` and `/data/road_graph.json` before the
clock starts. No API hunting during build hours.

---

## 3. File architecture (don't deviate — this fixes Bob's mess)

```
/data/wards.json
/data/road_graph.json
/models/schemas.py          — Pydantic: Ward, Edge, Observation, RoadStatusUpdate, AuditEvent
/services/hazard_service.py        — H only
/services/vulnerability_service.py — V and Q (Q independent, never multiplied)
/services/priority_service.py      — P, team sizing, assignment
/services/routing_service.py       — Dijkstra + no-path fallback
/services/observation_service.py   — POST /observation + audit event
/services/road_status_service.py   — POST /road-status + access_difficulty recompute + audit event
/services/vision_service.py        — YOLOv8n, isolated, optional, cuttable
/main.py                           — routes only, no business logic
```

---

## 4. Formulas (exact — do not approximate)

**Hazard Index (per ward, 0-100):**
```
H_flood = 0.35*R + 0.30*L + 0.20*E + 0.15*F
R = rainfall_norm
L = river_level_norm = min(river_level_m / danger_level_m, 1.2), then min-max normalized
E = low_elevation_susceptibility_norm (SRTM-derived, inverted: lower elevation = higher score)
F = historical_freq_norm (flood_count_10y, min-max)
```
No slope term in the flood formula — slope belongs only to the (unbuilt,
documented-only) landslide mode. Never reuse H_flood's variable names for
landslide math.

**Vulnerability:**
```
V = population_at_risk_norm + elderly_disabled_pct_norm + hospital_school_proximity_norm + road_criticality_norm
```

**Confidence (Q) — the one everyone gets wrong first try:**
```
Q = f(data_freshness, source_completeness)   # 0-1
if Q < threshold: verification_flag = "VERIFY IMMEDIATELY"
```
Q is NEVER multiplied into priority. It's a separate flag only. Multiplying it
in would silently deprioritize exactly the wards that are under-monitored and
possibly high-risk — the opposite of what you want.

**Priority:**
```
H_i, V_i normalized to 0-1
P_i = 0.60*H_i + 0.40*V_i     # weighted sum, NOT H×V×Q
P_display = round(100 * P_i, 1)
```
`access_difficulty` is NEVER part of P. It's a routing/assignment constraint only:
```
access_difficulty = 0.5*blocked_road_ratio + 0.3*low_elevation_access_penalty + 0.2*distance_to_response_base
```

**Team sizing — this is the fix from the last review, get it right the first time:**
```python
people_to_assist = ward.observed_assistance_count if ward.observed_assistance_count is not None else ward.population_at_risk
base_responders = ceil(people_to_assist / illustrative_people_per_responder)  # e.g. 25, disclosed as illustrative
# +1 medical responder if elderly/disabled concentration or hospital proximity is high
# smaller sub-teams if access_difficulty is high
```
Do NOT use `min(population_at_risk, observed_assistance_count)`. A `min()`
here caps genuine evidence of MORE people needing help at the lower, stale
static estimate — exactly backwards. Evidence overrides the estimate; it
never gets capped by it.

**Assignment:**
Greedy: sort wards by P descending → assign nearest available team of matching
type (general if `access_difficulty` low, specialized if high) → until
capacity exhausted. If no available team meets a ward's need:
```
⚠ PARTIAL COVERAGE — request backup or split response
```
Never silently under-assign without this flag.

**Routing:**
```
edge_cost = base_travel_time + λ * max(H_j for j in exposed_wards) + (∞ or heavy penalty if blocked)
```
Run the primary shortest-path attempt on a **subgraph with blocked edges
removed**. Only fall back to the full graph with penalty weights if that
subgraph has no path. Do NOT rely on catching `NetworkXNoPath` against a
fully-connected graph where blocked edges are just weighted heavily — it will
NOT raise when a costly-but-connected path exists, so your no-path-found demo
case will silently never trigger. This is the most common bug in this design;
test it explicitly with a scenario where a ward is genuinely cut off.

No-path-found response:
```
"NO SAFE PATH FOUND — best available crosses N flagged segment(s), exposure: CRITICAL"
```
Feed back into the ward's `access_difficulty` / Accessibility flag — never
into its priority score.

---

## 5. Observation & road-status — two separate endpoints, two separate audit shapes

**`POST /observation`** (ward-level):
```json
{ "ward_id": "W5", "timestamp": "...", "detected_people_count": 35,
  "confidence": 0.72, "source_type": "simulated_field_observation" | "manual_entry",
  "image_ref": null }
```
- Manual entry (a typed number) MUST work standalone — this is your guaranteed
  demo path. YOLO is optional enrichment layered on top, never a dependency.
- Updates `observed_assistance_count`, never overwrites total ward population.
- Dedup rule: same ward + same timestamp + same source event → don't double-add.

**`POST /road-status`** (edge-level):
```json
{ "edge_id": "E12", "status": "blocked" | "open", "timestamp": "...", "source_type": "manual_entry" }
```
This is the ONLY thing that can mark a road blocked and trigger a reroute. It
must also recompute `access_difficulty` for any ward whose only route depends
on that edge — not just recalculate the route.

**Audit trail — two distinct event shapes:**
```json
{ "event": "observation_update", "ward_id": "W5", "old_priority": 61, "new_priority": 86,
  "reason": "observed_assistance_count increased 12 → 35", "timestamp": "..." }

{ "event": "road_status_update", "edge_id": "E12", "affected_wards": ["W5"],
  "old_access_difficulty": 0.3, "new_access_difficulty": 0.9,
  "reason": "edge E12 blocked", "timestamp": "..." }
```
Every field in these two shapes should exist in your API response so Shayanna
can render a live audit feed without guessing field names.

---

## 6. API contract (locked — tell Shayanna before you change any of this)

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

## 7. Build order (your gates — don't skip)

| Time | Task | Gate condition |
|---|---|---|
| 2:00–2:45 | Load data, `/hazard` | Gate 1 (2:45): ranked list works, non-rainiest-high-risk ward confirmed |
| 2:45–3:30 | V + Q, `/priorities` partial | — |
| 3:30–4:15 | P, team sizing, assignment, `/assignments` | Gate 2 (4:15): full ranked+sized+assigned, partial-coverage case works |
| 4:15–5:15 | Routing, no-path-found, `/route` | Gate 3 (5:15): one route + one no-path-found case working |
| 5:15–6:00 | `/observation` (manual first), audit trail | — |
| 6:00–6:30 | `/road-status`, live reroute | Gate 4 (6:30): full OBSERVE→RE-RANK→RE-ASSIGN→RE-ROUTE loop works end to end |
| 6:30–7:15 | YOLOv8n (optional) — **first thing cut if behind** | — |

**Never cut:** H, V, normalized P, ranked list, at least one assignment, at
least one route, no-path-found/partial-coverage handling, one
observation-triggered re-plan (manual entry is enough).

---

## 8. Non-negotiable language rules for your docstrings/README sections

Never write: "predictive," "learns," "adapts," "real-time" (applied to river
level or any synthetic field), "safest/fastest" unqualified. Never fabricate a
lives-saved/response-time/efficiency percentage. Team-size ratio, λ, and Q
threshold must be labeled illustrative, not calibrated, everywhere they appear.
