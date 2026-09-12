// ── RAIC API client ─────────────────────────────────────────────────────────
// All endpoints are stubbed (return null) until the backend is wired up.
// To connect: uncomment the fetch line inside each function and remove `return null;`
// Backend base: http://localhost:8000

// RAIC API client
const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_KEY = import.meta.env.VITE_RESPONSE_API_KEY || 'dev-only-key-change-me';

async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.method === 'POST' ? { 'X-API-Key': API_KEY } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`${path} ${response.status}`);
  }

  return response.json();
}

export function fetchScenario() {
  return request('/scenario');
}

export function fetchPriorities() {
  return request('/priorities');
}

export function fetchAssignments() {
  return request('/assignments');
}

export function fetchRoute(teamId, wardId) {
  return request(`/route/${encodeURIComponent(teamId)}/${encodeURIComponent(wardId)}`);
}

export function postObservation(wardIdOrPayload, detectedPeopleCount) {
  const payload = typeof wardIdOrPayload === 'object'
    ? wardIdOrPayload
    : {
        ward_id: wardIdOrPayload,
        detected_people_count: detectedPeopleCount,
        confidence: 0.85,
        source_type: 'manual_entry',
      };

  return request('/observation', {
    method: 'POST',
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
      confidence: 0.85,
      source_type: 'manual_entry',
      ...payload,
    }),
  });
}

export function postRoadStatus(edgeIdOrPayload, status) {
  const payload = typeof edgeIdOrPayload === 'object'
    ? edgeIdOrPayload
    : { edge_id: edgeIdOrPayload, status };

  return request('/road-status', {
    method: 'POST',
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
      source_type: 'manual_entry',
      ...payload,
    }),
  });
}

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
