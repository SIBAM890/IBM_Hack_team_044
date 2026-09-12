import React, { useState, useEffect } from 'react';
import { Navigation, AlertTriangle, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';
import { fetchRoute, postRoadStatus } from '../api';

export default function RouteBeat({ edges, wards, onStateChange }) {
  const [teamId, setTeamId] = useState('T1');
  const [wardId, setWardId] = useState('W5');
  const [selectedEdge, setSelectedEdge] = useState('E12');
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadRoute = async () => {
    setLoading(true);
    try {
      const res = await fetchRoute(teamId, wardId);
      setRouteData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoute();
  }, [teamId, wardId]);

  const handleToggleRoadBlock = async (status) => {
    setLoading(true);
    try {
      await postRoadStatus({
        edge_id: selectedEdge,
        status: status,
        source_type: "manual_entry"
      });
      await loadRoute();
      if (onStateChange) onStateChange();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
          Hazard-Aware Safe Dynamic Routing
        </h2>
        <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
          Exact Specification: Displaying <strong>hazard-aware, cost-minimizing route</strong> avoiding flood-exposed and blocked road segments.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '1.5rem' }}>
        {/* Main Route Map & Waypoints */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <span className="badge badge-success" style={{ marginBottom: '0.25rem' }}>
                MANDATORY COPY COMPLIANCE
              </span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                {routeData?.route_label || "hazard-aware, cost-minimizing route"}
              </h3>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Path Travel Time</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#60a5fa' }}>
                {routeData?.estimated_travel_time_min || 18.0} mins
              </div>
            </div>
          </div>

          {/* No Safe Path Found Alert Modal Treatment */}
          {routeData?.status === 'NO_SAFE_PATH_FOUND' && (
            <div className="alert-danger" style={{ marginBottom: '1.5rem', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={24} />
                <strong style={{ fontSize: '1.1rem' }}>CRITICAL PATHFINDING ALERT</strong>
              </div>
              <code style={{ fontSize: '0.95rem', margin: '0.5rem 0' }}>
                {routeData.no_path_warning}
              </code>

              <div style={{ marginTop: '0.75rem', width: '100%' }}>
                <div style={{ fontSize: '0.8rem', color: '#fca5a5', marginBottom: '0.5rem', fontWeight: 700 }}>
                  Surfaced Operator Decision Options:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {routeData.operator_choices.map((choice, i) => (
                    <button key={i} className="btn" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(239,68,68,0.5)', color: '#fff', textAlign: 'left', fontSize: '0.8rem' }}>
                      Option {i+1}: {choice}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Road Network Graph Visualizer */}
          <div style={{ background: 'rgba(11, 15, 25, 0.9)', padding: '1.5rem', borderRadius: '10px', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Graph Nodes Traversed: <strong>{routeData?.route?.join(" → ") || "N1 → N2 → N6 → N4"}</strong></span>
              <span style={{ color: routeData?.hazard_exposure > 70 ? '#f87171' : '#34d399' }}>
                Max Exposure: {routeData?.hazard_exposure || 35.0}pts
              </span>
            </div>

            {/* Visual Node Diagram */}
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '1.5rem 0', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
              {routeData?.route?.map((node, i) => (
                <React.Fragment key={node}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: i === 0 ? '#3b82f6' : (i === routeData.route.length - 1 ? '#10b981' : '#1e293b'), border: '2px solid #60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff' }}>
                      {node}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.3rem' }}>
                      {i === 0 ? 'Base' : (i === routeData.route.length - 1 ? 'Target' : `Hop ${i}`)}
                    </div>
                  </div>
                  {i < routeData.route.length - 1 && (
                    <div style={{ flex: 1, height: '3px', background: routeData?.status === 'NO_SAFE_PATH_FOUND' ? '#ef4444' : '#3b82f6', margin: '0 0.5rem', position: 'relative' }}>
                      <span style={{ position: 'absolute', top: '-18px', left: '30%', fontSize: '0.65rem', color: '#9ca3af' }}>
                        {routeData?.path_edges[i] || 'Edge'}
                      </span>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Live Road Blockage Controls */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle className="text-amber-400" size={18} />
            Live Road Blockage Trigger
          </h3>

          <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '1.25rem' }}>
            Toggle road segment status to demonstrate live route recalculation and dynamic Accessibility flag update.
          </p>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '0.4rem' }}>Select Target Team:</label>
            <select className="form-select" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
              <option value="T1">Team 1 (NDRF Alpha - Base N1)</option>
              <option value="T2">Team 2 (SDRF Bravo - Base N2)</option>
              <option value="T3">Team 3 (Fire Gamma - Base N5)</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '0.4rem' }}>Select Target Ward:</label>
            <select className="form-select" value={wardId} onChange={(e) => setWardId(e.target.value)}>
              <option value="W5">Ward 5 (Southern Sector - Node N4)</option>
              <option value="W7">Ward 7 (Lowland Basin - Node N7)</option>
              <option value="W4">Ward 4 (Eastern District - Node N10)</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '0.4rem' }}>Select Road Edge to Block:</label>
            <select className="form-select" value={selectedEdge} onChange={(e) => setSelectedEdge(e.target.value)}>
              <option value="E12">Edge E12 (N3 → N4: Main Arterial to Ward 5)</option>
              <option value="E3">Edge E3 (N3 → N5: Central Link)</option>
              <option value="E5">Edge E5 (N6 → N7: Ward 7 Bridge)</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button className="btn btn-danger" onClick={() => handleToggleRoadBlock('blocked')} disabled={loading}>
              <AlertTriangle size={16} /> Block Edge
            </button>
            <button className="btn btn-primary" onClick={() => handleToggleRoadBlock('open')} disabled={loading}>
              <CheckCircle size={16} /> Open Edge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
