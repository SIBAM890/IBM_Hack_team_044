import json
from pathlib import Path

from models.schemas import Edge
from services import routing_service


def test_route_endpoint_returns_valid_state(client):
    response = client.get("/route/T1/W1")
    assert response.status_code == 200
    assert response.json().get("status") in {"SUCCESS", "FALLBACK"}


def test_all_blocked_edges_return_no_safe_path():
    edge_data = json.loads((Path(__file__).parents[1] / "data" / "road_graph.json").read_text())
    edges = []
    for edge in edge_data["edges"]:
        edge["blocked"] = True
        edges.append(Edge(**edge))
    result = routing_service.find_safest_fastest_route("Base", "W1", edges, [])
    assert result["status"] == "FALLBACK"
    assert "CRITICAL" in result["warning"]