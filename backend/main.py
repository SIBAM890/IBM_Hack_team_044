"""
RAIC — Rapid Assessment & Intelligent Coordination
Self-contained FastAPI backend for Patna Monsoon Inundation scenario.

Run:
    uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

Required packages (in addition to requirements.txt):
    pip install networkx
"""
import math
from datetime import datetime, timezone
import networkx as nx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="RAIC — Disaster Risk Prioritization & Response", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────────────
DANGER_LEVEL_M   = 48.6   # Ganga at Patna documented danger mark (metres)
CONFIDENCE_HOURS = 12.0   # Telemetry age threshold → Q flag "VERIFY IMMEDIATELY"
TEAM_RATIO       = 25     # People per base responder (team-sizing divisor)

# ─────────────────────────────────────────────────────────────────────────────
# Ward Base Data — 8 wards, Patna District
#
# Factor columns are raw 0-100 input scores:
#   R = Rainfall intensity (normalised)
#   L = River level exceedance (normalised; 100 = at/above danger mark)
#   E = Elevation susceptibility (100 = very low-lying, high flood risk)
#   F = Historical flood frequency (normalised)
#
# Hazard:       H = 0.35·R + 0.30·L + 0.20·E + 0.15·F   (result 0-100)
# Vulnerability: V = stored as vulnerability_index (0-100), derived from
#               demographic density, hospital proximity, and access model.
# Priority:     P = 0.60·H + 0.40·V                       (result 0-100)
# Confidence Q: NEVER multiplied into P; shown as a separate operational flag.
#
# Ward 7 (Ganga Lowland)  — Low R (35.7) but river stage 50.1m (ratio > 1.0)
#   and elevation susceptibility 94.5.  Ranks near top via river/topography,
#   not rainfall alone.  Demonstrates multi-criteria decision fusion.
#
# Ward 3 (Digha Ghat Zone) — last_updated_hours_ago = 14.5 (> 12 h threshold)
#   → triggers Q = "LOW" / "VERIFY IMMEDIATELY" confidence flag.
# ─────────────────────────────────────────────────────────────────────────────
WARDS_BASE = [
    dict(id="W1", name="Ward 1 (Northern Coastal)",
         R=100.0, L=87.0, E=28.0, F=53.0,
         river_stage_m=49.2, vulnerability_index=22.0,
         population_at_risk=24000, people_to_assist_proxy=5,
         vulnerable_pop_ratio=0.22, has_hospital=False,
         access_difficulty=0.20, last_updated_hours_ago=2.0,
         lat=25.585, lng=85.040),
    dict(id="W2", name="Ward 2 (Central Medical Hub)",
         R=36.0, L=33.0, E=30.0, F=27.0,
         river_stage_m=48.5, vulnerability_index=84.0,
         population_at_risk=48000, people_to_assist_proxy=8,
         vulnerable_pop_ratio=0.45, has_hospital=True,
         access_difficulty=0.30, last_updated_hours_ago=1.5,
         lat=25.597, lng=85.128),
    dict(id="W3", name="Ward 3 (Riverside Sector)",
         R=60.0, L=80.0, E=55.0, F=73.0,
         river_stage_m=49.8, vulnerability_index=45.0,
         population_at_risk=31000, people_to_assist_proxy=6,
         vulnerable_pop_ratio=0.30, has_hospital=False,
         access_difficulty=0.40, last_updated_hours_ago=14.5,  # STALE → Q = LOW
         lat=25.625, lng=85.085),
    dict(id="W4", name="Ward 4 (Eastern District)",
         R=63.0, L=75.0, E=60.0, F=80.0,
         river_stage_m=50.0, vulnerability_index=65.0,
         population_at_risk=38000, people_to_assist_proxy=6,
         vulnerable_pop_ratio=0.35, has_hospital=True,
         access_difficulty=0.50, last_updated_hours_ago=3.0,
         lat=25.610, lng=85.210),
    dict(id="W5", name="Ward 5 (Southern Core)",
         R=76.0, L=74.0, E=70.0, F=93.0,
         river_stage_m=49.9, vulnerability_index=30.0,
         population_at_risk=15000, people_to_assist_proxy=5,
         vulnerable_pop_ratio=0.20, has_hospital=False,
         access_difficulty=0.40, last_updated_hours_ago=4.0,
         lat=25.570, lng=85.140),
    dict(id="W6", name="Ward 6 (Central Commercial)",
         R=34.0, L=28.0, E=50.0, F=40.0,
         river_stage_m=48.4, vulnerability_index=52.0,
         population_at_risk=29000, people_to_assist_proxy=4,
         vulnerable_pop_ratio=0.28, has_hospital=True,
         access_difficulty=0.20, last_updated_hours_ago=2.5,
         lat=25.578, lng=85.118),
    dict(id="W7", name="Ward 7 (Lowland Basin)",
         R=35.7, L=100.0, E=94.5, F=100.0,   # LOW R, HIGH L and E — multi-criteria
         river_stage_m=50.1, vulnerability_index=78.0,
         population_at_risk=42000, people_to_assist_proxy=175,  # tuned: required=8
         vulnerable_pop_ratio=0.40, has_hospital=True,
         access_difficulty=0.85, last_updated_hours_ago=5.0,
         lat=25.640, lng=85.155),
    dict(id="W8", name="Ward 8 (Peri-Urban Fringe)",
         R=14.0, L=8.0, E=20.0, F=13.0,
         river_stage_m=47.8, vulnerability_index=18.5,
         population_at_risk=8000, people_to_assist_proxy=2,
         vulnerable_pop_ratio=0.12, has_hospital=False,
         access_difficulty=0.10, last_updated_hours_ago=6.0,
         lat=25.550, lng=85.095),
]

# ─────────────────────────────────────────────────────────────────────────────
# Team Assignments
# SDRF Bravo (capacity 5) is deliberately assigned to W7 which requires 8
# responders → triggers partial-coverage warning for the demo.
# ─────────────────────────────────────────────────────────────────────────────
TEAM_ASSIGNMENTS = {
    "W7": {"callsign": "SDRF Bravo",    "capacity": 5},
    "W4": {"callsign": "NDRF Alpha",    "capacity": 10},
    "W3": {"callsign": "NDRF Bravo",    "capacity": 10},
    "W5": {"callsign": "NDRF Charlie",  "capacity": 10},
    "W1": {"callsign": "NDRF Delta",    "capacity": 10},
    "W2": {"callsign": "NDRF Alpha",    "capacity": 10},
    "W6": {"callsign": "NDRF Bravo",    "capacity": 10},
    "W8": {"callsign": "NDRF Charlie",  "capacity": 10},
}

# ─────────────────────────────────────────────────────────────────────────────
# Road Network Graph
#
# E12 (EastBypass → GangaSouth) is the PRIMARY corridor to Ward 7.
# GangaSouth can ONLY be reached via E12 in the base graph.
# When E12 is blocked, primary Dijkstra finds no path to W7.
# Fallback Dijkstra allows blocked edges with +9999 penalty → status = "NO SAFE PATH FOUND".
# ─────────────────────────────────────────────────────────────────────────────
GRAPH_EDGES = [
    # (from_node, to_node, edge_id, weight_minutes)
    ("HQ",         "W1",         "E1",  5.0),
    ("HQ",         "W2",         "E2",  4.0),
    ("HQ",         "W6",         "E3",  3.0),
    ("HQ",         "EastBypass", "E4",  4.0),
    ("EastBypass", "W4",         "E5",  6.0),
    ("GangaSouth", "W7",         "E6",  3.0),
    ("EastBypass", "GangaSouth", "E12", 5.0),   # ← PRIMARY CORRIDOR (blockable)
    ("W2",         "W3",         "E7",  5.0),
    ("W6",         "W5",         "E8",  4.0),
    ("W5",         "W8",         "E9",  8.0),
    ("W3",         "W4",         "E10", 7.0),
]

# Node coordinates for frontend map rendering
NODE_COORDS = {
    "HQ":         {"lat": 25.560, "lng": 85.050},
    "EastBypass": {"lat": 25.620, "lng": 85.130},
    "GangaSouth": {"lat": 25.645, "lng": 85.145},
    "W1":         {"lat": 25.585, "lng": 85.040},
    "W2":         {"lat": 25.597, "lng": 85.128},
    "W3":         {"lat": 25.625, "lng": 85.085},
    "W4":         {"lat": 25.610, "lng": 85.210},
    "W5":         {"lat": 25.570, "lng": 85.140},
    "W6":         {"lat": 25.578, "lng": 85.118},
    "W7":         {"lat": 25.640, "lng": 85.155},
    "W8":         {"lat": 25.550, "lng": 85.095},
}

# ─────────────────────────────────────────────────────────────────────────────
# Mutable State
# ─────────────────────────────────────────────────────────────────────────────
observations:  dict = {}   # ward_id  → observed count (overrides proxy)
road_statuses: dict = {}   # edge_id  → True (blocked) / False (open)
audit_log:     list = []


# ─────────────────────────────────────────────────────────────────────────────
# Core Computation
# ─────────────────────────────────────────────────────────────────────────────
def compute_wards() -> list:
    results = []
    for w in WARDS_BASE:
        # Hazard index: H = 0.35·R + 0.30·L + 0.20·E + 0.15·F
        H = 0.35 * w["R"] + 0.30 * w["L"] + 0.20 * w["E"] + 0.15 * w["F"]
        H = round(min(100.0, max(0.0, H)), 1)

        # Vulnerability (pre-stored composite model: demographic density + hospital
        # proximity + access difficulty; updated proportionally on field observation)
        V = float(w["vulnerability_index"])

        # If field observation reports significantly more people than proxy,
        # scale up effective vulnerability to reflect increased scope.
        if w["id"] in observations:
            obs_count = observations[w["id"]]
            proxy     = w["people_to_assist_proxy"]
            if obs_count > proxy:
                scale = min(2.0, obs_count / max(proxy, 1))
                V = min(100.0, round(V * scale, 1))

        # Priority: P = 0.60·H + 0.40·V  (Q is NEVER multiplied into P)
        P = round(0.60 * H + 0.40 * V, 1)

        # Confidence flag (decoupled from P)
        Q     = "LOW" if w["last_updated_hours_ago"] > CONFIDENCE_HOURS else "HIGH"
        vflag = "VERIFY IMMEDIATELY" if Q == "LOW" else None

        # People to assist (field observation overrides proxy)
        people = observations.get(w["id"], w["people_to_assist_proxy"])

        # Team sizing: base = ceil(people / 25), +1 medical if hospital/elderly high
        base     = math.ceil(max(people, 1) / TEAM_RATIO)
        medical  = w["has_hospital"] or w["vulnerable_pop_ratio"] > 0.35
        required = base + (1 if medical else 0)

        # Team assignment
        team     = TEAM_ASSIGNMENTS.get(w["id"], {"callsign": "NDRF Unit", "capacity": 10})
        assigned = min(required, team["capacity"])
        partial  = assigned < required

        # Access difficulty worsens for W7 if primary corridor (E12) is blocked
        access = w["access_difficulty"]
        if w["id"] == "W7" and road_statuses.get("E12", False):
            access = min(1.0, round(access + 0.30, 2))

        results.append({
            "id":                     w["id"],
            "name":                   w["name"],
            "hazard_index":           H,
            "factor_breakdown":       {
                "R": round(0.35 * w["R"], 1),
                "L": round(0.30 * w["L"], 1),
                "E": round(0.20 * w["E"], 1),
                "F": round(0.15 * w["F"], 1),
            },
            "river_stage_m":          w["river_stage_m"],
            "vulnerability_index":    V,
            "priority_score":         P,
            "confidence":             Q,
            "verification_flag":      vflag,
            "confidence_score":       round(1.0 - min(1.0, w["last_updated_hours_ago"] / 24.0), 2),
            "last_updated_hours_ago": w["last_updated_hours_ago"],
            "population_at_risk":     w["population_at_risk"],
            "people_to_assist":       people,
            "vulnerable_pop_ratio":   w["vulnerable_pop_ratio"],
            "has_hospital":           w["has_hospital"],
            "access_difficulty":      access,
            "accessibility_label":    (
                "CRITICAL → specialized team / alternate transport"
                if access >= 0.70 else "NORMAL → standard road access"
            ),
            "lat":                    w["lat"],
            "lng":                    w["lng"],
            "team": {
                "callsign":  team["callsign"],
                "capacity":  team["capacity"],
                "required":  required,
                "assigned":  assigned,
                "has_medical": medical,
                "partial":   partial,
                "warning":   (
                    f"{w['name']} requires {required} responders — "
                    f"{team['callsign']} capacity is {team['capacity']}. "
                    "Request additional backup or split response."
                ) if partial else None,
            },
        })

    return sorted(results, key=lambda x: x["priority_score"], reverse=True)


def compute_route(target: str = "W7") -> dict:
    """Two-tier Dijkstra: primary excludes blocked edges; fallback allows them
    with a +9999 penalty and sets status to 'NO SAFE PATH FOUND'."""

    # ── Primary search (strictly excludes blocked edges) ─────────────────────
    G_primary = nx.DiGraph()
    for frm, to, eid, wt in GRAPH_EDGES:
        if not road_statuses.get(eid, False):
            G_primary.add_edge(frm, to, weight=wt, edge_id=eid, blocked=False)

    if nx.has_path(G_primary, "HQ", target):
        path  = nx.shortest_path(G_primary, "HQ", target, weight="weight")
        cost  = nx.shortest_path_length(G_primary, "HQ", target, weight="weight")
        edges = [G_primary[path[i]][path[i + 1]]["edge_id"] for i in range(len(path) - 1)]
        return {
            "path":             path,
            "edges_used":       edges,
            "travel_time_min":  round(cost, 1),
            "status":           "OPTIMAL",
            "severed_segments": 0,
            "node_coords":      {n: NODE_COORDS.get(n) for n in path if n in NODE_COORDS},
        }

    # ── Fallback search (blocked edges get penalty 9999) ─────────────────────
    G_fallback = nx.DiGraph()
    for frm, to, eid, wt in GRAPH_EDGES:
        blocked = road_statuses.get(eid, False)
        G_fallback.add_edge(frm, to,
                            weight=wt + (9999 if blocked else 0),
                            edge_id=eid, blocked=blocked)

    if nx.has_path(G_fallback, "HQ", target):
        path    = nx.shortest_path(G_fallback, "HQ", target, weight="weight")
        edges   = [G_fallback[path[i]][path[i + 1]]["edge_id"] for i in range(len(path) - 1)]
        severed = sum(1 for e in edges if road_statuses.get(e, False))
        return {
            "path":             path,
            "edges_used":       edges,
            "travel_time_min":  None,
            "status":           "NO SAFE PATH FOUND",
            "severed_segments": severed,
            "node_coords":      {n: NODE_COORDS.get(n) for n in path if n in NODE_COORDS},
        }

    return {
        "path":             [],
        "edges_used":       [],
        "travel_time_min":  None,
        "status":           "NO SAFE PATH FOUND",
        "severed_segments": 0,
        "node_coords":      {},
    }


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"system": "RAIC", "status": "operational", "port": 8000}


@app.get("/scenario")
def get_scenario():
    wards = compute_wards()
    route = compute_route("W7")
    return {
        "district":       "District Emergency Operations",
        "danger_level_m": DANGER_LEVEL_M,
        "wards":          wards,
        "route_to_w7":    route,
        "road_statuses":  dict(road_statuses),
        "audit_log":      list(reversed(audit_log)),   # most-recent first
    }


class ObservationRequest(BaseModel):
    ward_id: str
    count: int


@app.post("/observation")
def post_observation(req: ObservationRequest):
    old_map = {w["id"]: w for w in compute_wards()}
    old_p   = old_map.get(req.ward_id, {}).get("priority_score", "—")
    old_n   = old_map.get(req.ward_id, {}).get("people_to_assist", "—")

    observations[req.ward_id] = req.count

    new_map = {w["id"]: w for w in compute_wards()}
    new_p   = new_map.get(req.ward_id, {}).get("priority_score", "—")

    event = {
        "type":         "observation_update",
        "ward_id":      req.ward_id,
        "count":        req.count,
        "old_priority": old_p,
        "new_priority": new_p,
        "timestamp":    datetime.now(timezone.utc).isoformat(),
        "description":  (
            f"[OBS] {req.ward_id}: observed_count {old_n} → {req.count}.  "
            f"Priority {old_p} → {new_p}"
        ),
    }
    audit_log.append(event)
    return {"status": "ok", "event": event, "updated_ward": new_map.get(req.ward_id)}


class RoadStatusRequest(BaseModel):
    edge_id: str
    blocked: bool


@app.post("/road-status")
def post_road_status(req: RoadStatusRequest):
    old_status = "blocked" if road_statuses.get(req.edge_id, False) else "open"
    road_statuses[req.edge_id] = req.blocked
    new_status = "blocked" if req.blocked else "open"

    route = compute_route("W7")

    event = {
        "type":         "road_status_update",
        "edge_id":      req.edge_id,
        "old_status":   old_status,
        "new_status":   new_status,
        "route_status": route["status"],
        "timestamp":    datetime.now(timezone.utc).isoformat(),
        "description":  (
            f"[ROAD] Edge {req.edge_id}: {old_status} → {new_status}.  "
            f"Route to W7: {route['status']}"
        ),
    }
    audit_log.append(event)
    return {"status": "ok", "event": event, "route": route}
