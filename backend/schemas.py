from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

from backend.models import DisasterType, DisasterSeverity, DisasterStatus


class DisasterBase(BaseModel):
    """Base schema for disaster data"""
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    disaster_type: DisasterType
    severity: DisasterSeverity
    location: str = Field(..., min_length=1, max_length=255)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    district: str = Field(..., min_length=1, max_length=100)
    state: str = Field(..., min_length=1, max_length=100)
    affected_population: int = Field(default=0, ge=0)
    casualties: int = Field(default=0, ge=0)
    estimated_damage: float = Field(default=0.0, ge=0.0)
    resources_deployed: Optional[str] = None
    response_team: Optional[str] = None


class DisasterCreate(DisasterBase):
    """Schema for creating a disaster"""
    pass


class DisasterUpdate(BaseModel):
    """Schema for updating a disaster"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, min_length=1)
    disaster_type: Optional[DisasterType] = None
    severity: Optional[DisasterSeverity] = None
    status: Optional[DisasterStatus] = None
    location: Optional[str] = Field(None, min_length=1, max_length=255)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    district: Optional[str] = Field(None, min_length=1, max_length=100)
    state: Optional[str] = Field(None, min_length=1, max_length=100)
    affected_population: Optional[int] = Field(None, ge=0)
    casualties: Optional[int] = Field(None, ge=0)
    estimated_damage: Optional[float] = Field(None, ge=0.0)
    resources_deployed: Optional[str] = None
    response_team: Optional[str] = None


class DisasterResponse(DisasterBase):
    """Schema for disaster response"""
    id: int
    status: DisasterStatus
    reported_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True
