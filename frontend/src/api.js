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

