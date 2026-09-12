"""
Answers Q4 indirectly.
Handles POST /road-status handling + access_difficulty recompute + audit event, §9.2
"""
from typing import List, Dict, Any
from models.schemas import RoadStatusUpdate, Edge, RoadStatusAuditEvent, Ward
from datetime import datetime

def handle_road_status_update(status_update: RoadStatusUpdate, edges_db: List[Edge], wards_db: List[Ward]) -> Dict[str, Any]:
    target_edge = next((e for e in edges_db if e.edge_id == status_update.edge_id), None)
    if not target_edge:
        return {"error": "Edge not found"}
        
    is_now_blocked = status_update.status == "blocked"
    
    # Simple mock: if an edge becomes blocked, the access_difficulty of exposed wards increases
    # Since access_difficulty is not directly on the schema, we'll calculate a hypothetical before/after for the audit
    affected = target_edge.exposed_wards
    old_access_diff = 0.3 if not target_edge.blocked else 0.9
    new_access_diff = 0.9 if is_now_blocked else 0.3
    
    target_edge.blocked = is_now_blocked
    target_edge.last_updated = status_update.timestamp
    
    reason = f"edge {status_update.edge_id} {status_update.status}"
    
    audit_event = RoadStatusAuditEvent(
        timestamp=datetime.utcnow(),
        reason=reason,
        edge_id=status_update.edge_id,
        affected_wards=affected,
        old_access_difficulty=old_access_diff,
        new_access_difficulty=new_access_diff
    )
    
    return {
        "status": "success",
        "audit_event": audit_event.model_dump()
    }
