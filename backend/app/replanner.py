from datetime import datetime
from typing import Dict, List, Any
from backend.app.scoring import calculate_hazard_and_vulnerability
from backend.app.assignment import assign_teams

# Global in-memory state for live demo session
OBSERVATIONS: Dict[str, Dict[str, Any]] = {}
ROAD_STATUSES: Dict[str, bool] = {}
AUDIT_LOGS: List[Dict[str, Any]] = []

def get_current_state():
    scores = calculate_hazard_and_vulnerability(OBSERVATIONS, ROAD_STATUSES)
    assignments = assign_teams(scores)
    return {
        "ward_scores": scores,
        "assignments": assignments,
        "road_statuses": ROAD_STATUSES,
        "audit_logs": list(reversed(AUDIT_LOGS))
    }

def record_observation(ward_id: str, detected_people_count: int, confidence: float = 0.8, source_type: str = "manual_entry", image_ref: str = None):
    state_before = get_current_state()
    old_ward = state_before["ward_scores"].get(ward_id, {})
    old_p = old_ward.get("priority_score", 50.0)
    old_count = old_ward.get("observed_assistance_count") or old_ward.get("population_at_risk", 1000)
    
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    OBSERVATIONS[ward_id] = {
        "detected_people_count": detected_people_count,
        "confidence": confidence,
        "source_type": source_type,
        "image_ref": image_ref,
        "timestamp": timestamp
    }
    
    state_after = get_current_state()
    new_ward = state_after["ward_scores"].get(ward_id, {})
    new_p = new_ward.get("priority_score", 50.0)
    
    audit_event = {
        "event": "observation_update",
        "ward_id": ward_id,
        "old_priority": old_p,
        "new_priority": new_p,
        "reason": f"observed_assistance_count increased {old_count} → {detected_people_count}",
        "timestamp": timestamp
    }
    
    AUDIT_LOGS.append(audit_event)
    return {
        "status": "success",
        "audit_event": audit_event,
        "updated_ward": new_ward,
        "assignments": state_after["assignments"]
    }

def record_road_status(edge_id: str, status: str, source_type: str = "manual_entry"):
    is_blocked = (status.lower() == "blocked")
    state_before = get_current_state()
    
    # Identify affected ward (e.g. W5 for E12)
    affected_wards = ["W5"] if edge_id == "E12" else ["W2", "W3"]
    first_ward_id = affected_wards[0]
    old_access = state_before["ward_scores"].get(first_ward_id, {}).get("access_difficulty", 0.3)
    
    timestamp = datetime.utcnow().isoformat() + "Z"
    ROAD_STATUSES[edge_id] = is_blocked
    
    state_after = get_current_state()
    new_access = state_after["ward_scores"].get(first_ward_id, {}).get("access_difficulty", 0.9)
    
    audit_event = {
        "event": "road_status_update",
        "edge_id": edge_id,
        "affected_wards": affected_wards,
        "old_access_difficulty": old_access,
        "new_access_difficulty": new_access,
        "reason": f"edge {edge_id} {status.lower()}",
        "timestamp": timestamp
    }
    
    AUDIT_LOGS.append(audit_event)
    return {
        "status": "success",
        "audit_event": audit_event,
        "road_status": {edge_id: status},
        "affected_wards": affected_wards,
        "updated_ward": state_after["ward_scores"].get(first_ward_id, {})
    }
