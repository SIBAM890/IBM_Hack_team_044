"""
Answers Q4: Hazard-aware, cost-minimizing route.
Dijkstra on blocked-removed subgraph + fallback.
"""
import heapq
from typing import List, Dict, Any, Tuple
from models.schemas import Edge

LAMBDA_HAZARD_WEIGHT = 1.0
BLOCKED_PENALTY = 999999.0

def _get_max_hazard(exposed_wards: List[str], hazards: List[Dict]) -> float:
    h_map = {h['ward_id']: h['hazard_index'] for h in hazards}
    max_h = 0.0
    for w_id in exposed_wards:
        h = h_map.get(w_id, 0.0)
        if h > max_h:
            max_h = h
    return max_h

def _calculate_edge_cost(edge: Edge, hazards: List[Dict], is_fallback: bool) -> float:
    base_cost = edge.base_travel_time_min
    max_hazard = _get_max_hazard(edge.exposed_wards, hazards)
    
    hazard_penalty = LAMBDA_HAZARD_WEIGHT * max_hazard
    cost = base_cost + hazard_penalty
    
    if is_fallback and edge.blocked:
        cost += BLOCKED_PENALTY
        
    return cost

def _dijkstra(start_node: str, target_node: str, edges: List[Edge], hazards: List[Dict], is_fallback: bool) -> Tuple[List[str], float, int]:
    # Build adjacency list
    graph = {}
    
    for edge in edges:
        if not is_fallback and edge.blocked:
            continue
            
        if edge.from_node not in graph:
            graph[edge.from_node] = []
        if edge.to_node not in graph:
            graph[edge.to_node] = []
            
        cost = _calculate_edge_cost(edge, hazards, is_fallback)
        graph[edge.from_node].append((edge.to_node, cost, edge.blocked))
        # Assuming undirected for simplicity, but PRD uses 'from'/'to' so let's treat as directed
        # Actually road networks are usually bidirectional, let's add reverse edge too just in case
        graph[edge.to_node].append((edge.from_node, cost, edge.blocked))
        
    if start_node not in graph:
        return [], float('inf'), 0
        
    pq = [(0, start_node, [start_node], 0)]
    visited = set()
    
    while pq:
        current_cost, current_node, path, blocked_count = heapq.heappop(pq)
        
        if current_node == target_node:
            return path, current_cost, blocked_count
            
        if current_node in visited:
            continue
            
        visited.add(current_node)
        
        for neighbor, edge_cost, is_blocked in graph.get(current_node, []):
            if neighbor not in visited:
                new_blocked_count = blocked_count + (1 if is_blocked else 0)
                heapq.heappush(pq, (current_cost + edge_cost, neighbor, path + [neighbor], new_blocked_count))
                
    return [], float('inf'), 0

def find_safest_fastest_route(start_node: str, target_node: str, edges: List[Edge], hazards: List[Dict]) -> Dict[str, Any]:
    # Primary attempt: blocked edges completely removed
    path, cost, _ = _dijkstra(start_node, target_node, edges, hazards, is_fallback=False)
    
    if path:
        return {
            "status": "SUCCESS",
            "path": path,
            "total_cost": cost,
            "warning": None
        }
        
    # Fallback attempt: full penalized graph
    path, cost, blocked_count = _dijkstra(start_node, target_node, edges, hazards, is_fallback=True)
    
    if path:
        return {
            "status": "FALLBACK",
            "path": path,
            "total_cost": cost,
            "warning": f"NO SAFE PATH FOUND — best available crosses {blocked_count} flagged segment(s), exposure: CRITICAL"
        }
        
    return {
        "status": "FAILED",
        "path": [],
        "total_cost": float('inf'),
        "warning": "NO PATH EXISTS"
    }
