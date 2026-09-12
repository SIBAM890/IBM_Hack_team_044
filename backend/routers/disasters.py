from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import logging

from backend.database import get_db
from backend.models import Disaster, DisasterStatus, DisasterType, DisasterSeverity
from backend.schemas import DisasterCreate, DisasterUpdate, DisasterResponse

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/", response_model=DisasterResponse, status_code=status.HTTP_201_CREATED)
def create_disaster(
    disaster: DisasterCreate,
    db: Session = Depends(get_db)
):
    """Create a new disaster incident"""
    try:
        db_disaster = Disaster(**disaster.model_dump())
        db.add(db_disaster)
        db.commit()
        db.refresh(db_disaster)
        logger.info(f"Created disaster incident: {db_disaster.id}")
        return db_disaster
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating disaster: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create disaster incident"
        )


@router.get("/", response_model=List[DisasterResponse])
def list_disasters(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    disaster_type: Optional[DisasterType] = None,
    severity: Optional[DisasterSeverity] = None,
    status_filter: Optional[DisasterStatus] = None,
    district: Optional[str] = None,
    state: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all disaster incidents with optional filters"""
    try:
        query = db.query(Disaster)
        
        if disaster_type:
            query = query.filter(Disaster.disaster_type == disaster_type)
        if severity:
            query = query.filter(Disaster.severity == severity)
        if status_filter:
            query = query.filter(Disaster.status == status_filter)
        if district:
            query = query.filter(Disaster.district.ilike(f"%{district}%"))
        if state:
            query = query.filter(Disaster.state.ilike(f"%{state}%"))
        
        disasters = query.order_by(Disaster.reported_at.desc()).offset(skip).limit(limit).all()
        return disasters
    except Exception as e:
        logger.error(f"Error listing disasters: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve disasters"
        )


@router.get("/{disaster_id}", response_model=DisasterResponse)
def get_disaster(
    disaster_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific disaster incident by ID"""
    disaster = db.query(Disaster).filter(Disaster.id == disaster_id).first()
    if not disaster:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Disaster with ID {disaster_id} not found"
        )
    return disaster


@router.put("/{disaster_id}", response_model=DisasterResponse)
def update_disaster(
    disaster_id: int,
    disaster_update: DisasterUpdate,
    db: Session = Depends(get_db)
):
    """Update a disaster incident"""
    db_disaster = db.query(Disaster).filter(Disaster.id == disaster_id).first()
    if not db_disaster:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Disaster with ID {disaster_id} not found"
        )
    
    try:
        update_data = disaster_update.model_dump(exclude_unset=True)
        
        # If status is being changed to resolved, set resolved_at timestamp
        if "status" in update_data and update_data["status"] == DisasterStatus.RESOLVED:
            update_data["resolved_at"] = datetime.utcnow()
        
        for field, value in update_data.items():
            setattr(db_disaster, field, value)
        
        db.commit()
        db.refresh(db_disaster)
        logger.info(f"Updated disaster incident: {disaster_id}")
        return db_disaster
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating disaster {disaster_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update disaster incident"
        )


@router.delete("/{disaster_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_disaster(
    disaster_id: int,
    db: Session = Depends(get_db)
):
    """Delete a disaster incident"""
    db_disaster = db.query(Disaster).filter(Disaster.id == disaster_id).first()
    if not db_disaster:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Disaster with ID {disaster_id} not found"
        )
    
    try:
        db.delete(db_disaster)
        db.commit()
        logger.info(f"Deleted disaster incident: {disaster_id}")
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting disaster {disaster_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete disaster incident"
        )


@router.get("/stats/summary")
def get_disaster_stats(db: Session = Depends(get_db)):
    """Get summary statistics of disasters"""
    try:
        total_disasters = db.query(Disaster).count()
        active_disasters = db.query(Disaster).filter(
            Disaster.status.in_([DisasterStatus.REPORTED, DisasterStatus.ACTIVE])
        ).count()
        
        total_affected = db.query(Disaster).with_entities(
            db.func.sum(Disaster.affected_population)
        ).scalar() or 0
        
        total_casualties = db.query(Disaster).with_entities(
            db.func.sum(Disaster.casualties)
        ).scalar() or 0
        
        total_damage = db.query(Disaster).with_entities(
            db.func.sum(Disaster.estimated_damage)
        ).scalar() or 0.0
        
        return {
            "total_disasters": total_disasters,
            "active_disasters": active_disasters,
            "total_affected_population": int(total_affected),
            "total_casualties": int(total_casualties),
            "total_estimated_damage": float(total_damage)
        }
    except Exception as e:
        logger.error(f"Error getting disaster stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve disaster statistics"
        )
