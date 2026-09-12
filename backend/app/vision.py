import os
from typing import Dict, Any
from backend.app.replanner import record_observation, record_road_status

# Simulated AI Vision Detection Model for Drone Shots
DRONE_PRESETS = {
    "drone_flood_rooftop.jpg": {
        "ward_id": "W5",
        "ward_name": "Ward 5 (Kankarbagh South)",
        "detected_people_count": 42,
        "flood_water_depth_cm": 135,
        "detected_blocked_edge": "E12",
        "vision_confidence": 0.94,
        "hazard_summary": "Mass rooftop stranding detected. 42 citizens signaling for help. Submerged ground access.",
        "authority_recommendation": "Elevate Ward 5 priority to CRITICAL. Dispatch Boat/Air team immediately.",
        "field_user_action": "Target Rooftop Cluster B: 42 victims. Use inflatable rescue craft."
    },
    "drone_road_blockage.jpg": {
        "ward_id": "W2",
        "ward_name": "Ward 2 (PMCH Medical Hub)",
        "detected_people_count": 18,
        "flood_water_depth_cm": 90,
        "detected_blocked_edge": "E12",
        "vision_confidence": 0.91,
        "hazard_summary": "Major arterial road E12 blocked by 14 submerged vehicles and floating urban debris.",
        "authority_recommendation": "Mark Edge E12 IMPASSABLE. Reroute Team 1 via Edge E2-E6 network.",
        "field_user_action": "Avoid Edge E12. Divert via Eastern bypass road node N6."
    }
}

def analyze_drone_imagery(image_filename: str) -> Dict[str, Any]:
    preset = DRONE_PRESETS.get(image_filename, {
        "ward_id": "W5",
        "ward_name": "Ward 5 (Kankarbagh South)",
        "detected_people_count": 35,
        "flood_water_depth_cm": 110,
        "detected_blocked_edge": "E12",
        "vision_confidence": 0.88,
        "hazard_summary": "Drone AI Detection: Stranded population on roofs with surrounding floodwaters.",
        "authority_recommendation": "Recalculate Ward 5 priority and deploy available rescue units.",
        "field_user_action": "Approach via unflooded northern perimeter."
    })
    
    # 1. Convert detection output -> Authority Observation Update
    obs_res = record_observation(
        ward_id=preset["ward_id"],
        detected_people_count=preset["detected_people_count"],
        confidence=preset["vision_confidence"],
        source_type="drone_ai_vision",
        image_ref=image_filename
    )
    
    # 2. Convert detection output -> Authority Road Status Update if blocked
    road_res = None
    if preset.get("detected_blocked_edge"):
        road_res = record_road_status(
            edge_id=preset["detected_blocked_edge"],
            status="blocked",
            source_type="drone_ai_vision"
        )

    return {
        "drone_image_ref": image_filename,
        "analysis_results": preset,
        "authority_components": {
            "title": "Authority Decision Components (District Control Room)",
            "updated_ward_priority": obs_res["updated_ward"]["priority_score"],
            "updated_access_difficulty": obs_res["updated_ward"]["access_difficulty"],
            "recommendation": preset["authority_recommendation"],
            "audit_events_generated": [obs_res["audit_event"], road_res["audit_event"] if road_res else None]
        },
        "user_components": {
            "title": "Field Rescue Team & Public Components (Ground Units)",
            "target_location": f"{preset['ward_name']} (Coordinates: {obs_res['updated_ward']['latitude']}, {obs_res['updated_ward']['longitude']})",
            "people_needing_assistance": preset["detected_people_count"],
            "water_depth_cm": preset["flood_water_depth_cm"],
            "field_action_guide": preset["field_user_action"]
        }
    }
