"""
Answers Q3: Who responds first?
Calculates Priority (P), Team Sizing, and Assignment.
P = 0.60·H + 0.40·V
access_difficulty is NOT folded into P.
"""
from typing import List, Dict, Any
from models.schemas import Ward
import math

# Constant for sizing teams
PEOPLE_PER_RESPONDER = 25

def calculate_priorities_and_sizes(wards: List[Ward], hazards: List[Dict], vulnerabilities: List[Dict]) -> List[Dict]:
    results = []
    
    # Map for easy lookup
    h_map = {h['ward_id']: h for h in hazards}
    v_map = {v['ward_id']: v for v in vulnerabilities}
    
    for w in wards:
        h_data = h_map.get(w.ward_id)
        v_data = v_map.get(w.ward_id)
        
        if not h_data or not v_data:
            continue
            
        # P calculation (normalized internally 0-1)
        h_norm_internal = h_data['hazard_index'] / 100.0
        v_norm_internal = v_data['v_norm']
        
        p_i = 0.60 * h_norm_internal + 0.40 * v_norm_internal
        p_display = round(100 * p_i, 1)
        
        # Team sizing
        people_to_assist = w.observed_assistance_count if w.observed_assistance_count is not None else w.population_at_risk
        base_responders = math.ceil(people_to_assist / PEOPLE_PER_RESPONDER)
        
        # Add +1 medical responder if elderly/disabled or hospital proximity is high
        medical_responders = 0
        if w.elderly_disabled_percent > 0.15 or w.hospital_school_proximity > 0.7:
            medical_responders = 1
            
        results.append({
            "ward_id": w.ward_id,
            "priority": p_display,
            "hazard_index": h_data['hazard_index'],
            "vulnerability_score": v_data['v_score'],
            "confidence_flag": v_data['confidence_flag'],
            "freshness_hours": v_data['freshness_hours'],
            "people_to_assist": people_to_assist,
            "required_general_responders": base_responders,
            "required_medical_responders": medical_responders,
                "total_required": base_responders + medical_responders,
        })
        
    # Sort by priority descending
    results.sort(key=lambda x: x["priority"], reverse=True)
    return results

def assign_teams(priority_results: List[Dict], available_teams: List[Dict]) -> List[Dict]:
    assignments = []
    # Copy available teams to manage capacity
    teams = [dict(t) for t in available_teams]
    
    for req in priority_results:
        ward_id = req["ward_id"]
        needed = req["total_required"]
        
        # Find best team (greedy, nearest available with capacity)
        # Assuming available_teams are just sorted by some preference or we pick the first with capacity
        assigned = False
        for t in teams:
            if t['capacity'] > 0:
                allocated = min(needed, t['capacity'])
                t['capacity'] -= allocated
                needed -= allocated
                
                partial = needed > 0
                
                assignments.append({
                    "ward_id": ward_id,
                    "team_id": t['team_id'],
                    "allocated": allocated,
                    "still_needed": needed,
                    "partial_coverage_warning": partial,
                    "coverage_status": "PARTIAL" if partial else "FULL"
                })
                
                if needed <= 0:
                    assigned = True
                    break
                    
        if needed > 0:
            # If we went through all teams and still need more
            assignments.append({
                "ward_id": ward_id,
                "team_id": "NONE",
                "allocated": 0,
                "still_needed": needed,
                "partial_coverage_warning": True,
                "coverage_status": "PARTIAL"
            })
            
    return assignments
