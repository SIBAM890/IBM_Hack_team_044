import React, { useState, useEffect, useCallback } from 'react';
import LandingPage from './components/LandingPage';
import {
  fetchPriorities, fetchAssignments, fetchRoute,
  fetchScenario, postObservation, postRoadStatus,
} from './api';

// ── Fallback data (used when backend is offline) ─────────────────────────────
const FALLBACK_WARDS = [
  {
    id: 'W1', name: 'Ward 1 (Northern Coastal)',
    hazard_index: 68.5, factor_breakdown: 'L: 20pts, R: 35pts, F: 8pts, E: 5.5pts',
    vulnerability_index: 35.0, priority_score: 55.1,
    access_difficulty: 0.2, accessibility_label: 'NORMAL → standard road access',
    population_at_risk: 24000, confidence: 'HIGH', verification_flag: null,
  },
  {
    id: 'W2', name: 'Ward 2 (Central Medical Hub)',
    hazard_index: 32.5, factor_breakdown: 'L: 10pts, R: 12.5pts, F: 4pts, E: 6.0pts',
    vulnerability_index: 84.0, priority_score: 53.1,
    access_difficulty: 0.3, accessibility_label: 'NORMAL → standard road access',
    population_at_risk: 48000, confidence: 'HIGH', verification_flag: null,
  },
  {
    id: 'W3', name: 'Ward 3 (Riverside Sector)',
    hazard_index: 62.0, factor_breakdown: 'L: 25pts, R: 18pts, F: 11pts, E: 8.0pts',
    vulnerability_index: 45.0, priority_score: 82.0,
    access_difficulty: 0.4, accessibility_label: 'NORMAL → standard road access',
    population_at_risk: 31000,
    confidence: 'LOW',
    confidence_score: 0.42,
    confidence_reason: 'River Gauge telemetry sensor last reported 14.5 hours ago (data stale).',
    verification_flag: 'VERIFY IMMEDIATELY',
  },
  {
    id: 'W4', name: 'Ward 4 (Eastern District)',
    hazard_index: 71.0, factor_breakdown: 'L: 22pts, R: 25pts, F: 12pts, E: 12.0pts',
    vulnerability_index: 65.0, priority_score: 68.6,
    access_difficulty: 0.5, accessibility_label: 'NORMAL → standard road access',
    population_at_risk: 38000, confidence: 'HIGH', verification_flag: null,
  },
  {
    id: 'W5', name: 'Ward 5 (Southern Core)',
    hazard_index: 74.2, factor_breakdown: 'L: 28pts, R: 26.5pts, F: 14pts, E: 5.7pts',
    vulnerability_index: 38.0, priority_score: 59.7,
    access_difficulty: 0.4, accessibility_label: 'NORMAL → standard road access',
    population_at_risk: 15000, confidence: 'HIGH', verification_flag: null,
  },
  {
    id: 'W6', name: 'Ward 6 (Central Commercial)',
    hazard_index: 42.0, factor_breakdown: 'L: 12pts, R: 14pts, F: 6pts, E: 10.0pts',
    vulnerability_index: 52.0, priority_score: 46.0,
    access_difficulty: 0.2, accessibility_label: 'NORMAL → standard road access',
    population_at_risk: 29000, confidence: 'HIGH', verification_flag: null,
  },
  {
    id: 'W7', name: 'Ward 7 (Lowland Basin)',
    hazard_index: 76.4, factor_breakdown: 'L: 30pts, R: 12.5pts, F: 15pts, E: 18.9pts',
    vulnerability_index: 78.0, priority_score: 77.0,
    access_difficulty: 0.85, accessibility_label: 'CRITICAL → specialized team / alternate transport',
    population_at_risk: 42000, confidence: 'HIGH', verification_flag: null,
  },
  {
    id: 'W8', name: 'Ward 8 (Peri-Urban Fringe)',
    hazard_index: 48.0, factor_breakdown: 'L: 5pts, R: 5pts, F: 2pts, E: 36.0pts',
    vulnerability_index: 18.5, priority_score: 36.2,
    access_difficulty: 0.1, accessibility_label: 'NORMAL → standard road access',
    population_at_risk: 8000, confidence: 'HIGH', verification_flag: null,
  },
];

const FALLBACK_AUDIT = [
  {
    event: 'observation_update', ward_id: 'W5',
    old_priority: 61, new_priority: 86,
    reason: 'observed_assistance_count increased 12 → 35',
    timestamp: '2026-09-12T18:30:00Z',
  },
  {
    event: 'road_status_update', edge_id: 'E12',
    affected_wards: ['W5'], old_access_difficulty: 0.3, new_access_difficulty: 0.9,
    reason: 'edge E12 blocked',
    timestamp: '2026-09-12T18:32:00Z',
  },
];

// ── WARD DEMOGRAPHICS ────────────────────────────────────────────────────────
// Static per-ward demographic tags shown under Population at Risk.
// Replace with real census/OGD-derived figures when available.
const WARD_DEMOGRAPHICS = {
  W1: '58% High-Density Residential | 14% Elderly/Disabled | Coastal Settlement',
  W2: '45% Medical/Commercial | 22% Elderly/Disabled | 1 Hospital (Regional Referral)',
  W3: '61% High-Density Residential | 19% Elderly/Disabled | Waterfront Sector',
  W4: '52% Mixed Residential | 16% Elderly/Disabled | Heritage Zone',
  W5: '67% Urban Residential | 12% Elderly/Disabled | Dense Core',
  W6: '48% Residential | 15% Elderly/Disabled | Commercial Corridor',
  W7: '62% High-Density Residential | 18% Elderly/Disabled | 1 Hospital (Medical Corridor)',
  W8: '71% Sparse Residential | 8% Elderly/Disabled | Peri-Urban Fringe',
};

// ── SAMPLE ROUTE DATA ─────────────────────────────────────────────────────────
// Clean operational dispatch paths with standardized staging depots and evacuation corridors.
const SAMPLE_ROUTES = {
  W1: {
    path:               'HQ Staging Base (Depot Alpha) → Corridor N1 → Ward 1 Centroid',
    travelMin:          11.8,
    corridorRisk:       'OPTIMAL',
    flaggedSegments:    0,
    shelter:            'Ward 1 → Coastal Embankment Road → Safe Haven Relief Camp 2',
    fallbackPath:       'HQ Staging Base (Depot Alpha) → West Perimeter Circuit → Ward 1 Centroid',
    fallbackTravelMin:  19.2,
  },
  W2: {
    path:               'HQ Staging Base (Depot Alpha) → Central Medical Arterial → Ward 2 Centroid',
    travelMin:          8.5,
    corridorRisk:       'OPTIMAL',
    flaggedSegments:    0,
    shelter:            'Ward 2 → Medical Evacuation Corridor → Safe Haven Camp 1 (Medical Hub)',
    fallbackPath:       'HQ Staging Base (Depot Alpha) → North Ring Bypass → Ward 2 Centroid',
    fallbackTravelMin:  15.0,
  },
  W3: {
    path:               'HQ Staging Base (Depot Alpha) → River Embankment Link → Ward 3 Centroid',
    travelMin:          16.1,
    corridorRisk:       'MODERATE',
    flaggedSegments:    1,
    shelter:            'Ward 3 → Riverside Relief Corridor → Safe Haven Relief Camp 3',
    fallbackPath:       'HQ Staging Base (Depot Alpha) → West Ridge Bypass → Ward 3 Centroid',
    fallbackTravelMin:  31.4,
  },
  W4: {
    path:               'HQ Staging Base (Depot Alpha) → Eastern Arterial Corridor → Ward 4 Centroid',
    travelMin:          18.3,
    corridorRisk:       'OPTIMAL',
    flaggedSegments:    0,
    shelter:            'Ward 4 → Eastern Relief Highway → Safe Haven Relief Camp 5',
    fallbackPath:       'HQ Staging Base (Depot Alpha) → North Outer Bypass → Ward 4 Centroid',
    fallbackTravelMin:  26.7,
  },
  W5: {
    path:               'HQ Staging Base (Depot Alpha) → South Central Link → Ward 5 Centroid',
    travelMin:          13.6,
    corridorRisk:       'OPTIMAL',
    flaggedSegments:    0,
    shelter:            'Ward 5 → Southern Relief Corridor → Safe Haven Relief Camp 4',
    fallbackPath:       'HQ Staging Base (Depot Alpha) → East Ring Bypass → Ward 5 Centroid',
    fallbackTravelMin:  28.5,
  },
  W6: {
    path:               'HQ Staging Base (Depot Alpha) → Central Commercial Trunk → Ward 6 Centroid',
    travelMin:          9.2,
    corridorRisk:       'OPTIMAL',
    flaggedSegments:    0,
    shelter:            'Ward 6 → Central Commercial Axis → Safe Haven Relief Camp 2',
    fallbackPath:       'HQ Staging Base (Depot Alpha) → South Circuit Bypass → Ward 6 Centroid',
    fallbackTravelMin:  17.8,
  },
  W7: {
    path:               'HQ Staging Base (Depot Alpha) → Northern Elevated Bypass → Ward 7 Centroid',
    travelMin:          14.2,
    corridorRisk:       'OPTIMAL',
    flaggedSegments:    0,
    shelter:            'Ward 7 → Elevated Embankment Axis → Safe Haven Relief Camp 4',
    fallbackPath:       'HQ Staging Base (Depot Alpha) → Western Floodwall Route → Ward 7 Centroid',
    fallbackTravelMin:  28.5,
  },
  W8: {
    path:               'HQ Staging Base (Depot Alpha) → Outer Perimeter Link → Ward 8 Centroid',
    travelMin:          22.0,
    corridorRisk:       'OPTIMAL',
    flaggedSegments:    0,
    shelter:            'Ward 8 → Peri-Urban Relief Axis → Safe Haven Relief Camp 6',
    fallbackPath:       'HQ Staging Base (Depot Alpha) → South Outer Bypass → Ward 8 Centroid',
    fallbackTravelMin:  35.5,
  },
};

// ── WARD MAP — node positions + edge list ─────────────────────────────────────
// SVG topological road network connecting operational ward centroids.
const MAP_NODES = {
  W1: { x: 62,  y: 148, label: 'W1' },
  W2: { x: 130, y: 108, label: 'W2' },
  W3: { x: 84,  y: 58,  label: 'W3' },
  W4: { x: 282, y: 78,  label: 'W4' },
  W5: { x: 200, y: 148, label: 'W5' },
  W6: { x: 196, y: 98,  label: 'W6' },
  W7: { x: 190, y: 28,  label: 'W7' },
  W8: { x: 134, y: 182, label: 'W8' },
};

const MAP_EDGES = [
  { id: 'E1',  from: 'W1', to: 'W2' },
  { id: 'E2',  from: 'W2', to: 'W3' },
  { id: 'E3',  from: 'W3', to: 'W7' },
  { id: 'E4',  from: 'W7', to: 'W4' },
  { id: 'E5',  from: 'W4', to: 'W6' },
  { id: 'E6',  from: 'W6', to: 'W2' },
  { id: 'E7',  from: 'W6', to: 'W5' },
  { id: 'E8',  from: 'W5', to: 'W8' },
  { id: 'E9',  from: 'W1', to: 'W8' },
  { id: 'E10', from: 'W2', to: 'W5' },
  { id: 'E11', from: 'W6', to: 'W7' },
  { id: 'E12', from: 'W5', to: 'W4' }, // primary corridor — blocked by Simulate road blockage
];

// ── Fallback assignments ──────────────────────────────────────────────────────
function buildFallbackAssignments(wards) {
  return wards.map((w, idx) => {
    const isW7 = w.id === 'W7';
    return {
      ward_id: w.id,
      team_id: `T${(idx % 5) + 1}`,
      team_callsign: isW7 ? 'SDRF Bravo' : `NDRF Unit ${(idx % 5) + 1}`,
      team_type: isW7 ? 'specialized' : (w.access_difficulty >= 0.6 ? 'specialized' : 'general'),
      team_capacity: isW7 ? 5 : 10,
      required_responders: isW7 ? 8 : 4,
      assigned_responders: isW7 ? 5 : 4,
      has_medical_responder: w.id === 'W2' || w.id === 'W4' || w.id === 'W7',
      partial_coverage: isW7,
      partial_coverage_warning: isW7
        ? 'Ward 7 requires 8 responders — SDRF Bravo capacity is 5. Request additional backup or split response.'
        : null,
    };
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function priorityLevel(score) {
  if (score >= 75) return 'critical';
  if (score >= 55) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

const FACTOR_LABELS = {
  L: 'River Level (L)',
  R: 'Rainfall (R)',
  F: 'Flood History (F)',
  E: 'Elevation Risk (E)',
};

function parseFactors(breakdown) {
  if (!breakdown) return [];
  return breakdown.split(',').map(s => {
    const m = s.trim().match(/^([A-Z]):\s*([\d.]+)pts$/);
    if (!m) return null;
    return { key: m[1], label: FACTOR_LABELS[m[1]] ?? m[1], pts: parseFloat(m[2]) };
  }).filter(Boolean);
}

function fmtTime(ts) {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });
  } catch { return ts; }
}

function fmtAuditDesc(log) {
  const parts = [];
  if (log.ward_id)   parts.push(`ward=${log.ward_id}`);
  if (log.edge_id)   parts.push(`edge=${log.edge_id}`);
  if (log.reason)    parts.push(log.reason);
  if (log.old_priority != null && log.new_priority != null)
    parts.push(`priority ${log.old_priority} → ${log.new_priority}`);
  if (log.old_access_difficulty != null && log.new_access_difficulty != null)
    parts.push(`access_difficulty ${log.old_access_difficulty} → ${log.new_access_difficulty}`);
  return parts.join('  ·  ');
}

// ── Sub-components ────────────────────────────────────────────────────────────

// Confidence banner — shown for any ward where confidence === 'LOW'.
// The priority score is displayed AS-IS (never deprioritized). This banner is
// always a separate element from the score line so the two cannot be conflated.
function ConfidenceBanner({ ward }) {
  if (ward.confidence !== 'LOW') return null;
  const q      = ward.confidence_score ?? '—';
  const reason = ward.confidence_reason ?? 'Sensor data is stale — exact timestamp unavailable.';
  return (
    <div className="confidence-banner" role="alert">
      <div className="cb-title">⚠ TELEMETRY WARNING: CONFIDENCE SCORE LOW (Q = {q})</div>
      <div className="cb-body">
        <div className="cb-line">{reason}</div>
        <div className="cb-line cb-action">Action: VERIFY IMMEDIATELY via ground patrol or secondary telemetry.</div>
        <div className="cb-line cb-note">
          Note: ward priority retained at {ward.priority_score.toFixed(1)} — stale inputs raise an
          operational alert but <strong>never deprioritize unmonitored populations</strong>.
        </div>
      </div>
    </div>
  );
}

// Route box — shows calculated dispatch and evacuation corridors
function RouteBox({ ward, route, roadBlocked }) {
  const isCriticalAccess = ward.access_difficulty >= 0.6;

  // ── Real backend data available ─────────────────────────────────────────────
  if (route !== null) {
    if (route.status === 'no_path' || route.status === 'NO_SAFE_PATH') {
      return (
        <div className="route-card route-card-critical">
          <div className="rc-top-bar">
            <div className="rc-status-pill rc-status-critical">
              <span className="rc-dot rc-dot-critical" />
              <span>NO PASSABLE GROUND CORRIDOR</span>
            </div>
            <div className="rc-time-chip rc-time-critical">Route Severed</div>
          </div>
          <div className="rc-alert-msg">
            All ground transit corridors to this sector are impassable or flooded. Specialized aerial/amphibious dispatch required.
          </div>
        </div>
      );
    }
    return (
      <div className="route-card route-card-normal">
        <div className="rc-top-bar">
          <div className="rc-status-pill">
            <span className="rc-dot rc-dot-ok" />
            <span>DISPATCH CORRIDOR (HQ → {ward.name.split('(')[0].trim()})</span>
          </div>
          {route.hazard_exposure != null && (
            <div className="rc-time-chip">Hazard: {route.hazard_exposure}</div>
          )}
        </div>
        <div className="rc-section">
          <div className="rc-section-label">ACTIVE TRANSIT PATH</div>
          <div className="rc-path-flow">
            {Array.isArray(route.route) ? route.route.map((node, idx) => (
              <React.Fragment key={idx}>
                <span className={`rc-node ${idx === 0 ? 'rc-node-hq' : idx === route.route.length - 1 ? 'rc-node-dest' : ''}`}>
                  {node}
                </span>
                {idx < route.route.length - 1 && <span className="rc-arrow">›</span>}
              </React.Fragment>
            )) : <span className="rc-node">—</span>}
          </div>
        </div>
        {isCriticalAccess && (
          <div className="rc-access-alert">
            ⚠ Extreme Access Difficulty ({ward.access_difficulty}): Requires high-clearance or specialized transport.
          </div>
        )}
      </div>
    );
  }

  // ── SAMPLE ROUTE DATA (Standardized fallback) ───────────────────────────────
  const s = SAMPLE_ROUTES[ward.id];
  if (!s) {
    return (
      <div className="route-card" style={{ color: 'var(--text-muted)' }}>
        Awaiting route telemetry...
      </div>
    );
  }

  const inboundSegments = (roadBlocked ? s.fallbackPath : s.path).split('→').map(p => p.trim());
  const outboundSegments = s.shelter.split('→').map(p => p.trim());
  const travelTime = roadBlocked ? s.fallbackTravelMin : s.travelMin;

  return (
    <div className={`route-card ${roadBlocked ? 'route-card-rerouted' : 'route-card-normal'}`}>
      {/* Top Status Header */}
      <div className="rc-top-bar">
        <div className="rc-status-pill">
          <span className={`rc-dot ${roadBlocked ? 'rc-dot-warn' : 'rc-dot-ok'}`} />
          <span>
            {roadBlocked
              ? 'REROUTED: Dynamic Avoidance Active (Primary Corridor E12 Severed)'
              : `${s.corridorRisk} PASSABLE (${s.flaggedSegments} Blockage Traversed)`}
          </span>
        </div>
        <div className="rc-time-chip">
          ⏱ <strong>{travelTime} min</strong> ETA
        </div>
      </div>

      {/* Inbound Dispatch */}
      <div className="rc-section">
        <div className="rc-section-label">INBOUND DISPATCH CORRIDOR</div>
        <div className="rc-path-flow">
          {inboundSegments.map((seg, idx) => (
            <React.Fragment key={idx}>
              <span className={`rc-node ${idx === 0 ? 'rc-node-hq' : idx === inboundSegments.length - 1 ? 'rc-node-dest' : ''}`}>
                {seg}
              </span>
              {idx < inboundSegments.length - 1 && <span className="rc-arrow">›</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Outbound Evacuation */}
      <div className="rc-section rc-section-outbound">
        <div className="rc-section-label">OUTBOUND EVACUATION &amp; SHELTER ROUTE</div>
        <div className="rc-path-flow">
          {outboundSegments.map((seg, idx) => (
            <React.Fragment key={idx}>
              <span className={`rc-node ${idx === outboundSegments.length - 1 ? 'rc-node-shelter' : ''}`}>
                {seg}
              </span>
              {idx < outboundSegments.length - 1 && <span className="rc-arrow">›</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {isCriticalAccess && (
        <div className="rc-access-alert">
          ⚠ Critical Sector Access: Elevated flood risk — specialized amphibious/high-clearance unit deployed.
        </div>
      )}
    </div>
  );
}

// Interactive SVG topological road network
function WardMap({ roadBlocked, activeId, onSelectWard }) {
  return (
    <div className="ward-map-container">
      <div className="ward-map-header">
        <div>
          <div className="dsec-title">Sector Connectivity Network</div>
          <div className="ward-map-subtitle">Topological road network &amp; real-time corridor status</div>
        </div>
        <div className="ward-map-legend">
          <span className="wm-legend-item">
            <span className="wm-line wm-line-open" /> Open
          </span>
          <span className="wm-legend-item">
            <span className="wm-line wm-line-blocked" /> Blocked (E12)
          </span>
          <span className="wm-legend-item">
            <span className="wm-dot wm-dot-active" /> Active Sector
          </span>
        </div>
      </div>

      <div className="ward-map-svg-wrap">
        <svg
          viewBox="0 0 360 210"
          width="100%"
          style={{ display: 'block' }}
          aria-label="Sector connectivity map showing road network"
        >
          <defs>
            <filter id="nodeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.12" />
            </filter>
            <filter id="activeGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#2563eb" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Grid pattern background */}
          <g opacity="0.04">
            {[30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(x => (
              <line key={`gx-${x}`} x1={x} y1={0} x2={x} y2={210} stroke="#000" strokeWidth="1" />
            ))}
            {[30, 60, 90, 120, 150, 180].map(y => (
              <line key={`gy-${y}`} x1={0} y1={y} x2={360} y2={y} stroke="#000" strokeWidth="1" />
            ))}
          </g>

          {/* Edges */}
          {MAP_EDGES.map(e => {
            const a = MAP_NODES[e.from];
            const b = MAP_NODES[e.to];
            const isBlocked = e.id === 'E12' && roadBlocked;
            return (
              <line
                key={e.id}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={isBlocked ? '#ef4444' : '#10b981'}
                strokeWidth={isBlocked ? 2.2 : 1.8}
                strokeDasharray={isBlocked ? '6 4' : undefined}
                strokeLinecap="round"
                opacity={isBlocked ? 0.95 : 0.75}
              />
            );
          })}

          {/* Edge badge for E12 */}
          {(() => {
            const a = MAP_NODES['W5'];
            const b = MAP_NODES['W4'];
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            return (
              <g transform={`translate(${mx}, ${my})`}>
                <rect
                  x="-18" y="-9" width="36" height="18" rx="4"
                  fill={roadBlocked ? '#fee2e2' : '#f1f5f9'}
                  stroke={roadBlocked ? '#ef4444' : '#cbd5e1'}
                  strokeWidth="1"
                />
                <text
                  x="0" y="3.5"
                  textAnchor="middle"
                  fontSize="8.5"
                  fontWeight="600"
                  fill={roadBlocked ? '#b91c1c' : '#64748b'}
                >
                  {roadBlocked ? 'E12 ✕' : 'E12'}
                </text>
              </g>
            );
          })()}

          {/* Nodes */}
          {Object.entries(MAP_NODES).map(([id, { x, y, label }]) => {
            const isActive = id === activeId;
            return (
              <g
                key={id}
                onClick={() => onSelectWard && onSelectWard(id)}
                style={{ cursor: 'pointer', transition: 'transform 0.15s' }}
                className="wm-node-group"
              >
                {isActive && (
                  <circle
                    cx={x} cy={y} r={17}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                    strokeOpacity="0.4"
                  />
                )}
                <circle
                  cx={x} cy={y} r={12}
                  fill={isActive ? '#1d4ed8' : '#ffffff'}
                  stroke={isActive ? '#1e40af' : '#94a3b8'}
                  strokeWidth={isActive ? 2 : 1.5}
                  filter={isActive ? 'url(#activeGlow)' : 'url(#nodeGlow)'}
                />
                <text
                  x={x} y={y + 3.5}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="700"
                  fill={isActive ? '#ffffff' : '#1e293b'}
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [currentTab,  setCurrentTab]  = useState('landing');
  const [wards,       setWards]       = useState(FALLBACK_WARDS);
  const [assignments, setAssignments] = useState(buildFallbackAssignments(FALLBACK_WARDS));
  const [auditLogs,   setAuditLogs]   = useState([...FALLBACK_AUDIT].reverse());
  const [selectedId,  setSelectedId]  = useState(null);
  const [route,       setRoute]       = useState(null);
  const [roadBlocked, setRoadBlocked] = useState(false); // drives fallback route display until backend wired
  const [obsCount,    setObsCount]    = useState(35);
  const [busy,        setBusy]        = useState(false);
  const [actionMsg,   setActionMsg]   = useState('');

  // Derived
  const sortedWards = [...wards].sort((a, b) => b.priority_score - a.priority_score);
  const activeId    = selectedId ?? sortedWards[0]?.id;
  const ward        = wards.find(w => w.id === activeId) ?? sortedWards[0] ?? null;
  const assignment  = assignments.find(a => a.ward_id === ward?.id) ?? null;
  const factors     = parseFactors(ward?.factor_breakdown);
  const maxPts      = Math.max(...factors.map(f => f.pts), 1);
  const level       = ward ? priorityLevel(ward.priority_score) : 'low';

  // ── Data loading ─────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    try {
      const [pri, asgn, scenario] = await Promise.all([
        fetchPriorities(),
        fetchAssignments(),
        fetchScenario(),
      ]);
      if (pri?.priorities?.length)      setWards(pri.priorities);
      if (asgn?.assignments?.length)    setAssignments(asgn.assignments);
      if (scenario?.audit_logs?.length) setAuditLogs([...scenario.audit_logs].reverse());
    } catch {
      // backend offline — keep fallback data, stay silent
    }
  }, []);

  const loadRoute = useCallback(async (teamId, wardId) => {
    try {
      const r = await fetchRoute(teamId, wardId);
      setRoute(r ?? null);
    } catch {
      setRoute(null);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (assignment && ward) loadRoute(assignment.team_id, ward.id);
    else setRoute(null);
  }, [activeId, assignment?.team_id, loadRoute]);

  // ── Actions ───────────────────────────────────────────────────────────────────
  async function handleObservation() {
    if (!ward) return;
    setBusy(true);
    setActionMsg('');
    try {
      await postObservation(ward.id, obsCount);
      await loadAll();
      if (assignment) await loadRoute(assignment.team_id, ward.id);
      setActionMsg('Observation submitted. Priorities, assignments, and route refreshed.');
    } catch {
      setActionMsg('Backend offline — observation not persisted, UI shows fallback data.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRoadBlock() {
    if (!ward) return;
    setBusy(true);
    setActionMsg('');
    try {
      await postRoadStatus('E12', 'blocked');
      await loadAll();
      if (assignment) await loadRoute(assignment.team_id, ward.id);
      setRoadBlocked(true); // flip fallback route display to blocked state
      setActionMsg('Edge E12 marked blocked. Re-fetched priorities, assignments, and route.');
    } catch {
      // Even if the backend call fails, flip the local display to show the blocked route
      setRoadBlocked(true);
      setActionMsg('Backend offline — road status not persisted; route display updated locally.');
    } finally {
      setBusy(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div id="app">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <header id="top-bar">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span id="system-name">RAIC</span>
          <span id="system-tagline">Disaster Risk Prioritization &amp; Response</span>
          
          <div className="nav-tabs">
            <button 
              className={`nav-tab ${currentTab === 'landing' ? 'active' : ''}`}
              onClick={() => setCurrentTab('landing')}
            >
              Overview
            </button>
            <button 
              className={`nav-tab ${currentTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentTab('dashboard')}
            >
              Command Control Room
            </button>
          </div>
        </div>
        <div id="header-meta">
          <span>District Emergency Operations</span>
          <span className="sep">·</span>
          <span>Active Inundation Scenario</span>
          <span className="sep">·</span>
          <span>{wards.length} wards monitored</span>
          {roadBlocked && (
            <>
              <span className="sep">·</span>
              <span style={{ color: '#b91c1c', fontWeight: 600 }}>E12 BLOCKED</span>
            </>
          )}
        </div>
      </header>

      {currentTab === 'landing' ? (
        <LandingPage 
          onLaunchDashboard={() => setCurrentTab('dashboard')}
          wardsCount={wards.length}
          roadBlocked={roadBlocked}
        />
      ) : (
        <>
          {/* ── Main split ───────────────────────────────────────────────────────── */}
          <div id="main-layout">

        {/* ── Ward list ────────────────────────────────────────────────────── */}
        <aside id="ward-list" role="list" aria-label="Wards sorted by priority">
          <div id="ward-list-header">Wards — sorted by priority ↓</div>

          {sortedWards.map(w => {
            const lv       = priorityLevel(w.priority_score);
            const isLow    = w.confidence === 'LOW';
            const isActive = w.id === activeId;
            return (
              <div
                key={w.id}
                role="listitem button"
                tabIndex={0}
                className={`ward-row level-${lv} ${isActive ? 'selected' : ''}`}
                onClick={() => setSelectedId(w.id)}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setSelectedId(w.id)}
                aria-selected={isActive}
              >
                <div className="ward-row-info">
                  <div className="ward-row-name">{w.name}</div>
                  <div className="ward-row-sub">P: {w.priority_score.toFixed(1)}</div>
                </div>
                {isLow && (
                  <span className="ward-warn-icon" title="VERIFY IMMEDIATELY — data confidence LOW">⚠</span>
                )}
                <span className={`p-badge level-${lv}`}>{Math.round(w.priority_score)}</span>
              </div>
            );
          })}
        </aside>

        {/* ── Detail panel ─────────────────────────────────────────────────── */}
        <main id="detail-panel">
          {!ward ? (
            <p id="detail-empty">Select a ward to view details.</p>
          ) : (
            <>
              {/* Ward name + priority badges */}
              <div className="dsec">
                <div className="detail-ward-name">{ward.name}</div>
                <div className="detail-badges">
                  <span className={`detail-p-badge p-badge level-${level}`}>
                    Priority {ward.priority_score.toFixed(1)} / 100
                  </span>
                  {assignment?.partial_coverage && (
                    <span className="inline-warning">⚠ PARTIAL COVERAGE</span>
                  )}
                </div>

                {/* Confidence banner — always separate from the priority score */}
                <ConfidenceBanner ward={ward} />
              </div>

              {/* Hazard factor breakdown */}
              <div className="dsec">
                <div className="dsec-title">Hazard Index — H = {ward.hazard_index} / 100</div>
                <div className="factor-list">
                  {factors.map(f => (
                    <div key={f.key} className="factor-row">
                      <span className="factor-key">{f.label}</span>
                      <div className="factor-bar-track">
                        <div
                          className="factor-bar-fill"
                          style={{ width: `${(f.pts / maxPts) * 100}%` }}
                        />
                      </div>
                      <span className="factor-pts">{f.pts} pts</span>
                    </div>
                  ))}
                </div>
                <div className="factor-formula">H = 0.35R + 0.30L + 0.20E + 0.15F (normalised 0–100)</div>
              </div>

              {/* Vulnerability & access */}
              <div className="dsec">
                <div className="dsec-title">Vulnerability &amp; Access</div>
                <div className="stat-grid">
                  <div>
                    <div className="stat-label">Vulnerability Index (V)</div>
                    <div className="stat-value">{ward.vulnerability_index} / 100</div>
                  </div>
                  <div>
                    <div className="stat-label">Population at Risk</div>
                    <div className="stat-value">
                      {ward.population_at_risk != null
                        ? ward.population_at_risk.toLocaleString('en-IN')
                        : '—'}
                    </div>
                    {WARD_DEMOGRAPHICS[ward.id] && (
                      <div className="stat-demo">Demographics: {WARD_DEMOGRAPHICS[ward.id]}</div>
                    )}
                  </div>
                  <div>
                    <div className="stat-label">Access Difficulty</div>
                    <div className="stat-value">{ward.access_difficulty}</div>
                  </div>
                  <div>
                    <div className="stat-label">Accessibility</div>
                    <div className="stat-value" style={{ fontSize: 12 }}>
                      {ward.accessibility_label ?? '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Assigned team */}
              <div className="dsec">
                <div className="dsec-title">Assigned Team</div>
                {assignment ? (
                  <>
                    <div className="stat-grid">
                      <div>
                        <div className="stat-label">Team</div>
                        <div className="stat-value">{assignment.team_callsign}</div>
                      </div>
                      <div>
                        <div className="stat-label">Assigned / Required</div>
                        <div className="stat-value">
                          {assignment.assigned_responders} / {assignment.required_responders}
                        </div>
                      </div>
                      <div>
                        <div className="stat-label">Team Capacity</div>
                        <div className="stat-value">{assignment.team_capacity} responders</div>
                      </div>
                      <div>
                        <div className="stat-label">Medical Responder</div>
                        <div className="stat-value">
                          {assignment.has_medical_responder ? 'Yes' : 'No'}
                        </div>
                      </div>
                    </div>
                    {assignment.partial_coverage_warning && (
                      <div className="verify-banner" style={{ marginTop: 10 }}>
                        <span className="vb-icon">⚠</span>
                        <span>{assignment.partial_coverage_warning}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    No assignment data available.
                  </span>
                )}
              </div>

              {/* Route */}
              <div className="dsec">
                <div className="dsec-title">Route &amp; Evacuation Corridor</div>
                <RouteBox ward={ward} route={route} roadBlocked={roadBlocked} />
              </div>

              {/* SVG ward map */}
              <div className="dsec">
                <WardMap roadBlocked={roadBlocked} activeId={activeId} onSelectWard={setSelectedId} />
              </div>

              {/* Simulate actions — the live re-plan loop */}
              <div className="dsec">
                <div className="dsec-title">Scenario Simulation &amp; Live Re-Plan</div>
                <div className="simulation-panel">
                  {/* Observation injection */}
                  <div className="sim-group">
                    <div className="sim-group-label">FIELD TELEMETRY INJECTION</div>
                    <div className="sim-input-row">
                      <div className="sim-field-wrap">
                        <label htmlFor="obs-count" className="sim-field-label">Assistance Count (Persons)</label>
                        <input
                          id="obs-count"
                          type="number"
                          min={1}
                          className="count-field"
                          value={obsCount}
                          onChange={e => setObsCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          title="Detected people count for field observation"
                          aria-label="Detected people count"
                        />
                      </div>
                      <button
                        id="btn-observation"
                        className="btn btn-primary"
                        onClick={handleObservation}
                        disabled={busy}
                        title={`POST /observation — ward=${ward.id}, count=${obsCount}`}
                      >
                        ⚡ Submit Observation
                      </button>
                    </div>
                  </div>

                  {/* Road disruption injection */}
                  <div className="sim-group">
                    <div className="sim-group-label">INFRASTRUCTURE DISRUPTION</div>
                    <div className="sim-input-row">
                      <button
                        id="btn-roadblock"
                        className={`btn ${roadBlocked ? 'btn-warn-active' : 'btn-secondary'}`}
                        onClick={handleRoadBlock}
                        disabled={busy || roadBlocked}
                        title="POST /road-status — edge=E12, status=blocked"
                      >
                        {roadBlocked ? '⛔ Corridor E12 Severed (Rerouting Active)' : '⚠ Sever Corridor E12 (Road Blockage)'}
                      </button>
                    </div>
                  </div>

                  {actionMsg && <div className="action-msg">{actionMsg}</div>}
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* ── Audit log ────────────────────────────────────────────────────────── */}
      <div id="audit-panel" role="log" aria-label="Audit log — most recent first">
        <div id="audit-header">Audit Log — most recent first</div>
        {auditLogs.length === 0 ? (
          <div className="audit-empty">No events recorded yet.</div>
        ) : (
          auditLogs.map((log, i) => (
            <div key={i} className={`audit-entry ${log.event ?? ''}`}>
              <span className="a-ts">{fmtTime(log.timestamp)}</span>
              <span className="a-event">{log.event}</span>
              <span className="a-desc">{fmtAuditDesc(log)}</span>
            </div>
          ))
        )}
      </div>
        </>
      )}

    </div>
  );
}
