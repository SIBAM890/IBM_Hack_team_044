import json
import os
import math
from typing import Dict, List, Any

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

def load_json(filename: str) -> Any:
    path = os.path.join(DATA_DIR, filename)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def calculate_hazard_and_vulnerability(observations: Dict[str, Any] = None, road_statuses: Dict[str, bool] = None):
    wards = load_json("wards.json")
    weather = load_json("weather_river.json")
    edges = load_json("edges.json")
    
    observations = observations or {}
    road_statuses = road_statuses or {}
    
    danger_level = weather.get("danger_level_m", 48.6)
    weather_wards = weather.get("wards", {})
    
    # 1. Compute raw terms for normalization
    raw_r = []
    raw_l = []
    raw_e = []
    raw_f = []
    
    raw_pop = []
    raw_vuln_ratio = []
    raw_hosp = []
    raw_crit = []
    
    for w in wards:
        wid = w["id"]
        w_weath = weather_wards.get(wid, {})
        
        # Rainfall score (recent + forecast)
        r_val = w_weath.get("rainfall_24h_mm", 0) + 0.5 * w_weath.get("rainfall_forecast_48h_mm", 0)
        raw_r.append((wid, r_val))
        
        # River level score
        l_val = min(w_weath.get("river_level_m", 48.0) / danger_level, 1.2)
        raw_l.append((wid, l_val))
        
        # Elevation susceptibility
        raw_e.append((wid, w.get("low_elevation_susceptibility", 0.5)))
        
        # Historical frequency
        raw_f.append((wid, w.get("historical_flood_count_10y", 1)))
        
        # Population (use observed_assistance_count if available for assistance sizing, but for V baseline pop + ratio)
        obs = observations.get(wid, {})
        assisted_pop = obs.get("detected_people_count", w.get("population_at_risk", 10000))
        raw_pop.append((wid, assisted_pop))
        raw_vuln_ratio.append((wid, w.get("vulnerable_pop_ratio", 0.2)))
        raw_hosp.append((wid, 1.0 if w.get("has_hospital_school") else 0.0))
        raw_crit.append((wid, w.get("road_criticality", 0.5)))

    # Min-max normalization helper
    def normalize_map(val_tuples):
        vals = [v for _, v in val_tuples]
        min_v, max_v = min(vals), max(vals)
        if max_v == min_v:
            return {k: 0.5 for k, _ in val_tuples}
        return {k: (v - min_v) / (max_v - min_v) for k, v in val_tuples}

    norm_r = normalize_map(raw_r)
    norm_l = normalize_map(raw_l)
    norm_e = normalize_map(raw_e)
    norm_f = normalize_map(raw_f)
    
    norm_pop = normalize_map(raw_pop)
    norm_vuln_ratio = normalize_map(raw_vuln_ratio)
    norm_hosp = normalize_map(raw_hosp)
    norm_crit = normalize_map(raw_crit)

    # Compute blocked road ratio per ward
    ward_blocked_ratio = {}
    for w in wards:
        wid = w["id"]
        exposed_edges = [e for e in edges if wid in e.get("exposed_wards", [])]
        if exposed_edges:
            blocked_count = sum(1 for e in exposed_edges if road_statuses.get(e["edge_id"], e.get("blocked", False)))
            ward_blocked_ratio[wid] = blocked_count / len(exposed_edges)
        else:
            ward_blocked_ratio[wid] = 0.0

    results = {}
    for w in wards:
        wid = w["id"]
        w_weath = weather_wards.get(wid, {})
        
        # H calculation: 0.35*R + 0.30*L + 0.20*E + 0.15*F
        pts_r = round(0.35 * norm_r[wid] * 100, 1)
        pts_l = round(0.30 * norm_l[wid] * 100, 1)
        pts_e = round(0.20 * norm_e[wid] * 100, 1)
        pts_f = round(0.15 * norm_f[wid] * 100, 1)
        
        h_score = round(pts_r + pts_l + pts_e + pts_f, 1)
        factor_breakdown = f"L: {pts_l}pts, R: {pts_r}pts, F: {pts_f}pts, E: {pts_e}pts"
        
        # V calculation: 0.35*pop + 0.25*vuln_ratio + 0.25*hosp + 0.15*crit
        v_score = round(100 * (0.35 * norm_pop[wid] + 0.25 * norm_vuln_ratio[wid] + 0.25 * norm_hosp[wid] + 0.15 * norm_crit[wid]), 1)
        
        # Q calculation: Data freshness
        hours_ago = w_weath.get("last_updated_hours_ago", 1.0)
        if hours_ago >= 6.0:
            confidence = "LOW"
            q_score = 0.35
            verification_flag = "VERIFY IMMEDIATELY"
            confidence_reason = f"river level last updated {int(hours_ago)}h ago"
        else:
            confidence = "HIGH"
            q_score = 0.95
            verification_flag = None
            confidence_reason = f"sensor data fresh ({hours_ago:.1f}h ago)"
            
        # Priority calculation: P = 0.60*H + 0.40*V
        p_score = round(0.60 * h_score + 0.40 * v_score, 1)
        
        # Access difficulty: 0.5*blocked_ratio + 0.3*E_norm + 0.2*base_penalty
        blocked_r = ward_blocked_ratio[wid]
        access_diff = round(0.50 * blocked_r + 0.30 * norm_e[wid] + 0.20 * (1.0 if wid in ["W4", "W7"] else 0.3), 2)
        if access_diff >= 0.60 or blocked_r > 0:
            access_label = "CRITICAL → specialized team / alternate transport"
        else:
            access_label = "NORMAL → standard road access"

        results[wid] = {
            "id": wid,
            "name": w["name"],
            "latitude": w["latitude"],
            "longitude": w["longitude"],
            "bounds": w["bounds"],
            "hazard_index": h_score,
            "hazard_disclaimer": "Normalized Hazard Index — decision support only, not a probability of flooding.",
            "factor_breakdown": factor_breakdown,
            "vulnerability_index": v_score,
            "confidence": confidence,
            "q_score": q_score,
            "verification_flag": verification_flag,
            "confidence_reason": confidence_reason,
            "priority_score": p_score,
            "access_difficulty": access_diff,
            "accessibility_label": access_label,
            "population_at_risk": w["population_at_risk"],
            "observed_assistance_count": observations.get(wid, {}).get("detected_people_count", None),
            "has_hospital_school": w["has_hospital_school"],
            "vulnerable_pop_ratio": w["vulnerable_pop_ratio"]
        }
        
    return results
