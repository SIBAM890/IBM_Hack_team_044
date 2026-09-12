// ── RAIC API client ─────────────────────────────────────────────────────────
// All endpoints are stubbed (return null) until the backend is wired up.
// To connect: uncomment the fetch line inside each function and remove `return null;`
// Backend base: http://localhost:8000

const BASE = 'http://localhost:8000';

// GET /scenario  — wards, edges, state snapshot (audit_logs live here)
export async function fetchScenario() {
  return null;
  // const res = await fetch(`${BASE}/scenario`);
  // if (!res.ok) throw new Error(`/scenario ${res.status}`);
  // return res.json();
}

// GET /priorities — P, V, Q, verification_flag per ward, sorted by priority desc
export async function fetchPriorities() {
  return null;
  // const res = await fetch(`${BASE}/priorities`);
  // if (!res.ok) throw new Error(`/priorities ${res.status}`);
  // return res.json();
}

// GET /assignments — team→ward table, team sizes, partial_coverage flags
export async function fetchAssignments() {
  return null;
  // const res = await fetch(`${BASE}/assignments`);
  // if (!res.ok) throw new Error(`/assignments ${res.status}`);
  // return res.json();
}

// GET /route/{team_id}/{ward_id} — route node list, status, hazard_exposure
export async function fetchRoute(teamId, wardId) {
  return null;
  // const res = await fetch(`${BASE}/route/${teamId}/${wardId}`);
  // if (!res.ok) throw new Error(`/route ${res.status}`);
  // return res.json();
}

// POST /observation — { ward_id, detected_people_count, confidence?, source_type? }
export async function postObservation(wardId, detectedPeopleCount) {
  return null;
  // const res = await fetch(`${BASE}/observation`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     ward_id: wardId,
  //     detected_people_count: detectedPeopleCount,
  //     source_type: 'manual_entry',
  //   }),
  // });
  // if (!res.ok) throw new Error(`/observation ${res.status}`);
  // return res.json();
}

// POST /road-status — { edge_id, status: 'blocked'|'open', source_type? }
export async function postRoadStatus(edgeId, status) {
  return null;
  // const res = await fetch(`${BASE}/road-status`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ edge_id: edgeId, status, source_type: 'manual_entry' }),
  // });
  // if (!res.ok) throw new Error(`/road-status ${res.status}`);
  // return res.json();
}
