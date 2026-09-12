import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parents[1]
os.environ.setdefault("DATA_DIR", str(BACKEND_DIR / "data"))
os.environ.setdefault("RESPONSE_API_KEY", "dev-only-key-change-me")
sys.path.insert(0, str(BACKEND_DIR))

from main import app, startup_event
from models.schemas import Ward


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        startup_event()
        yield test_client


@pytest.fixture
def sample_ward():
    return Ward(
        ward_id="W1",
        rainfall_24h_mm=120,
        rainfall_forecast_48h_mm=50,
        elevation_m=45,
        low_elevation_susceptibility=0.3,
        historical_flood_count_10y=2,
        river_level_m=46.5,
        population_at_risk=5000,
        elderly_disabled_percent=0.12,
        hospital_school_proximity=0.4,
        road_criticality=0.6,
        data_freshness_hours_ago=2,
    )