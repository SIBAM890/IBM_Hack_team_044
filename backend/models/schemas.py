from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime

class Ward(BaseModel):
    ward_id: str
    rainfall_24h_mm: float
    rainfall_forecast_48h_mm: float
    elevation_m: float
    low_elevation_susceptibility: float
    historical_flood_count_10y: int
    river_level_m: float
    population_at_risk: int
    elderly_disabled_percent: float
    hospital_school_proximity: float
    road_criticality: float
    data_freshness_hours_ago: int = 0
    observed_assistance_count: Optional[int] = None

class Edge(BaseModel):
    edge_id: str
    from_node: str = BaseModel.model_fields.get("from", None) # workaround for reserved word 'from'
    to_node: str
    base_travel_time_min: float
    blocked: bool
    exposed_wards: List[str]
    last_updated: datetime

    class Config:
        populate_by_name = True
        alias_generator = lambda string: 'from' if string == 'from_node' else ('to' if string == 'to_node' else string)


class Observation(BaseModel):
    ward_id: str = Field(min_length=1, max_length=16, pattern=r"^W\d+$")
    timestamp: datetime
    detected_people_count: int = Field(ge=0, le=500000)
    confidence: float = Field(ge=0.0, le=1.0)
    source_type: Literal["simulated_field_observation", "manual_entry"]
    image_ref: Optional[str] = Field(default=None, max_length=512)

class RoadStatusUpdate(BaseModel):
    edge_id: str = Field(min_length=1, max_length=16, pattern=r"^E\d+$")
    status: Literal["blocked", "open"]
    timestamp: datetime
    source_type: Literal["manual_entry"]

class AuditEvent(BaseModel):
    event: Literal["observation_update", "road_status_update"]
    timestamp: datetime
    reason: str

class ObservationAuditEvent(AuditEvent):
    event: Literal["observation_update"] = "observation_update"
    ward_id: str
    old_priority: float
    new_priority: float

class RoadStatusAuditEvent(AuditEvent):
    event: Literal["road_status_update"] = "road_status_update"
    edge_id: str
    affected_wards: List[str]
    old_access_difficulty: float
    new_access_difficulty: float
