from services import priority_service


def test_priority_formula_arithmetic(sample_ward):
    result = priority_service.calculate_priorities_and_sizes(
        [sample_ward],
        [{"ward_id": "W1", "hazard_index": 80.0}],
        [{"ward_id": "W1", "v_norm": 0.5, "v_score": 50.0, "confidence_flag": None, "freshness_hours": 1}],
    )
    assert result[0]["priority"] == 68.0


def test_same_h_and_v_are_independent_of_q(sample_ward):
    hazards = [{"ward_id": "W1", "hazard_index": 80.0}]
    first = [{"ward_id": "W1", "v_norm": 0.5, "v_score": 50.0, "confidence_flag": "VERIFY IMMEDIATELY", "freshness_hours": 20}]
    second = [{"ward_id": "W1", "v_norm": 0.5, "v_score": 50.0, "confidence_flag": None, "freshness_hours": 1}]
    p_first = priority_service.calculate_priorities_and_sizes([sample_ward], hazards, first)[0]["priority"]
    p_second = priority_service.calculate_priorities_and_sizes([sample_ward], hazards, second)[0]["priority"]
    assert p_first == p_second == 68.0


def test_priorities_contain_verification_flag(client):
    response = client.get("/priorities")
    assert response.status_code == 200
    assert any(item["confidence_flag"] == "VERIFY IMMEDIATELY" for item in response.json())
