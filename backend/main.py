import json
import os
import threading
from fastapi import Depends, FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from typing import List
from auth import require_api_key
from models.schemas import Observation, RoadStatusUpdate, Ward, Edge
from services import (
    hazard_service,
    vulnerability_service,
    priority_service,
    routing_service,
    observation_service,
    road_status_service,
)

app = FastAPI(title="Ward-Level Disaster Risk Prioritization", version="1.0.0")
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler to prevent stack trace leaks
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"message": "An internal server error occurred."},
    )

# Global state thread lock
db_lock = threading.Lock()

# Load data on startup
DATA_DIR = os.environ.get("DATA_DIR", "./data")
WARDS_FILE = os.path.join(DATA_DIR, "wards.json")
GRAPH_FILE = os.path.join(DATA_DIR, "road_graph.json")

def load_wards() -> List[Ward]:
    with open(WARDS_FILE, "r") as f:
        data = json.load(f)
        return [Ward(**w) for w in data]

def load_edges() -> List[Edge]:
    with open(GRAPH_FILE, "r") as f:
        data = json.load(f)
        return [Edge(**e) for e in data.get("edges", [])]

wards_db: List[Ward] = []
edges_db: List[Edge] = []

@app.on_event("startup")
def startup_event():
    global wards_db, edges_db
    wards_db = load_wards()
    edges_db = load_edges()

@app.get("/")
def root():
    return {"system": "RAIC", "status": "operational", "port": 8000}

@app.get("/scenario")
def get_scenario():
    """
    Returns the current state snapshot of the scenario (wards and edges).
    """
    with db_lock:
        return {
            "wards": [ward.model_dump() for ward in wards_db],
            "edges": [edge.model_dump() for edge in edges_db],
        }

@app.get("/hazard")
def get_hazard():
    """
    Returns the wards ranked by Hazard Index (H) descending.
    """
    return hazard_service.calculate_hazard(wards_db)

@app.get("/priorities")
def get_priorities():
    """
    Returns the wards ranked by Priority (P) descending, along with H, V, and Q.
    """
    hazards = hazard_service.calculate_hazard(wards_db)
    vulnerabilities = vulnerability_service.calculate_vulnerability_and_confidence(wards_db)
    return priority_service.calculate_priorities_and_sizes(wards_db, hazards, vulnerabilities)

@app.get("/assignments")
def get_assignments():
    """
    Returns the assignment of rescue teams to wards based on Priority.
    """
    hazards = hazard_service.calculate_hazard(wards_db)
    vulnerabilities = vulnerability_service.calculate_vulnerability_and_confidence(wards_db)
    priorities = priority_service.calculate_priorities_and_sizes(wards_db, hazards, vulnerabilities)
    
    # Mock available teams (total capacity: 200)
    available_teams = [
        {"team_id": "Team_Alpha", "capacity": 100},
        {"team_id": "Team_Beta", "capacity": 50},
        {"team_id": "Team_Gamma", "capacity": 50}
    ]
    
    return priority_service.assign_teams(priorities, available_teams)

@app.get("/route/{team_id}/{ward_id}")
def get_route(team_id: str, ward_id: str):
    hazards = hazard_service.calculate_hazard(wards_db)
    start_node = "Base"
    return routing_service.find_safest_fastest_route(start_node, ward_id, edges_db, hazards)

@app.post("/observation")
@limiter.limit("30/minute")
def post_observation(request: Request, obs: Observation, _: None = Depends(require_api_key)):
    with db_lock:
        return observation_service.handle_observation_update(obs, wards_db)

@app.post("/road-status")
@limiter.limit("30/minute")
def post_road_status(request: Request, status: RoadStatusUpdate, _: None = Depends(require_api_key)):
    with db_lock:
        return road_status_service.handle_road_status_update(status, edges_db, wards_db)

