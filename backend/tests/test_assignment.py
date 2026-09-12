from services.vulnerability_service import _effective_population


def test_assignments_contain_partial_coverage(client):
    response = client.get("/assignments")
    assert response.status_code == 200
    assert any(item.get("partial_coverage") or item.get("coverage_status") == "PARTIAL" for item in response.json())


def test_effective_population_prefers_observation(sample_ward):
    sample_ward.observed_assistance_count = 17
    assert _effective_population(sample_ward) == 17


def test_effective_population_falls_back_to_population(sample_ward):
    assert _effective_population(sample_ward) == sample_ward.population_at_risk