from datetime import datetime, timezone


def test_duplicate_observation_does_not_double_count(client):
    payload = {
        "ward_id": "W1",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "detected_people_count": 123,
        "confidence": 0.9,
        "source_type": "manual_entry",
    }
    headers = {"X-API-Key": "dev-only-key-change-me"}
    first = client.post("/observation", json=payload, headers=headers)
    second = client.post("/observation", json=payload, headers=headers)
    assert first.status_code == second.status_code == 200
    scenario = client.get("/scenario").json()
    assert next(ward for ward in scenario["wards"] if ward["ward_id"] == "W1")["observed_assistance_count"] == 123