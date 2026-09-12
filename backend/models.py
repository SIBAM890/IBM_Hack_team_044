from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Enum
from datetime import datetime
import enum

from backend.database import Base


class DisasterType(str, enum.Enum):
    """Types of disasters"""
    EARTHQUAKE = "earthquake"
    FLOOD = "flood"
    CYCLONE = "cyclone"
    FIRE = "fire"
    LANDSLIDE = "landslide"
    DROUGHT = "drought"
    TSUNAMI = "tsunami"
    OTHER = "other"


class DisasterSeverity(str, enum.Enum):
    """Severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class DisasterStatus(str, enum.Enum):
    """Disaster response status"""
    REPORTED = "reported"
    ACTIVE = "active"
    CONTAINED = "contained"
    RESOLVED = "resolved"


class Disaster(Base):
    """Disaster incident model"""
    __tablename__ = "disasters"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    disaster_type = Column(Enum(DisasterType), nullable=False, index=True)
    severity = Column(Enum(DisasterSeverity), nullable=False, index=True)
    status = Column(Enum(DisasterStatus), default=DisasterStatus.REPORTED, index=True)
    
    # Location information
    location = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    district = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    
    # Impact metrics
    affected_population = Column(Integer, default=0)
    casualties = Column(Integer, default=0)
    estimated_damage = Column(Float, default=0.0)
    
    # Response information
    resources_deployed = Column(Text, nullable=True)
    response_team = Column(String(255), nullable=True)
    
    # Timestamps
    reported_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<Disaster(id={self.id}, title='{self.title}', type={self.disaster_type}, severity={self.severity})>"
