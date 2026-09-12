import json
from pathlib import Path
from types import SimpleNamespace

from services import hazard_service


def _ward(ward_id, rainfall, river, elevation_score, floods):
    return SimpleNamespace(
        ward_id=ward_id,
        rainfall_24h_mm=rainfall,
        rainfall_forecast_48h_mm=0,
        river_level_m=river,
        low_elevation_susceptibility=elevation_score,
        historical_flood_count_10y=floods,
    )


def test_h_formula_returns_100_for_all_max_factors():
    result = hazard_service.calculate_hazard([_ward("W1", 100, 48.6, 1.0, 10), _ward("W2", 0, 0, 0.0, 0)])
    assert result[0]["hazard_index"] == 100.0


def test_h_formula_returns_0_for_all_min_factors():
    result = hazard_service.calculate_hazard([_ward("W1", 100, 48.6, 1.0, 10), _ward("W2", 0, 0, 0.0, 0)])
    assert result[-1]["hazard_index"] == 0.0


def test_river_level_normalization_caps_at_1_2():
    wards = [_ward("W1", 0, 48.6 * 2, 0.0, 0), _ward("W2", 0, 0, 0.0, 0)]
    result = {item["ward_id"]: item for item in hazard_service.calculate_hazard(wards)}
    assert result["W1"]["breakdown"]["L"] == 30.0


def test_lower_elevation_has_higher_e_contribution():
    wards = [_ward("W1", 0, 0, 1.0, 0), _ward("W2", 0, 0, 0.0, 0)]
    result = {item["ward_id"]: item for item in hazard_service.calculate_hazard(wards)}
    assert result["W1"]["breakdown"]["E"] > result["W2"]["breakdown"]["E"]


def test_hazard_top_ward_is_not_rainiest(client):
    response = client.get("/hazard")
    assert response.status_code == 200
    top_ward = response.json()[0]["ward_id"]
    wards = json.loads((Path(__file__).parents[1] / "data" / "wards.json").read_text())
    rainiest_ward = max(wards, key=lambda ward: ward["rainfall_24h_mm"] + ward["rainfall_forecast_48h_mm"])["ward_id"]
    assert top_ward != rainiest_ward