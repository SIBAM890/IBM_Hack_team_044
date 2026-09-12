"""
Answers Q2 & Q3 indirectly.
Handles POST /observation handling + audit event, §9.1
"""
from typing import List, Dict, Any
from models.schemas import Observation, Ward, ObservationAuditEvent
from datetime import datetime
from services import hazard_service, vulnerability_service, priority_service

def _get_ward_priority(ward_id: str, wards_db: List[Ward]) -> float:
    hazards = hazard_service.calculate_hazard(wards_db)
    vulns = vulnerability_service.calculate_vulnerability_and_confidence(wards_db)
    priorities = priority_service.calculate_priorities_and_sizes(wards_db, hazards, vulns)
    
    for p in priorities:
        if p['ward_id'] == ward_id:
            return p['priority']
    return 0.0

def handle_observation_update(obs: Observation, wards_db: List[Ward]) -> Dict[str, Any]:
    target_ward = next((w for w in wards_db if w.ward_id == obs.ward_id), None)
    if not target_ward:
        return {"error": "Ward not found"}
        
    old_priority = _get_ward_priority(obs.ward_id, wards_db)
    old_count = target_ward.observed_assistance_count
    
    # Update the observed count (overrides static estimate, never min() capped)
    target_ward.observed_assistance_count = obs.detected_people_count
    
    new_priority = _get_ward_priority(obs.ward_id, wards_db)
    
    reason = f"observed_assistance_count changed {old_count} → {obs.detected_people_count}"
    
    audit_event = ObservationAuditEvent(
        timestamp=datetime.utcnow(),
        reason=reason,
        ward_id=obs.ward_id,
        old_priority=old_priority,
        new_priority=new_priority
    )
    
    return {
        "status": "success",
        "audit_event": audit_event.model_dump()
    }
