import React from 'react';
import { ShieldCheck, AlertTriangle, Users, Ambulance, Compass } from 'lucide-react';

export default function AssignmentBeat({ assignments, wards }) {
  // Sort assignments by priority score
  const sorted = [...assignments].sort((a, b) => b.priority_score - a.priority_score);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
          Resource-Constrained Team Assignment & Accessibility Constraints
        </h2>
        <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
          Greedy priority matching assigns available rescue teams to high-priority wards, explicitly flagging capacity shortages and access difficulty constraints.
        </p>
      </div>

      {/* Partial Coverage Alert Banners */}
      {sorted.filter(a => a.partial_coverage).map((a, idx) => (
        <div key={idx} className="alert-danger" style={{ marginBottom: '1rem', padding: '1rem 1.25rem' }}>
          <AlertTriangle size={24} />
          <div style={{ fontSize: '0.95rem' }}>
            <strong>CRITICAL RESOURCE GAP ALERT:</strong><br />
            <code>{a.partial_coverage_warning}</code>
          </div>
        </div>
      ))}

      {/* Main Assignment Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users className="text-blue-400" size={18} />
          Priority Deployment Plan & Team Allocations
        </h3>

        <table className="custom-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Ward</th>
              <th>Priority Score (P)</th>
              <th>Accessibility Flag</th>
              <th>Assigned Team</th>
              <th>Responders Sizing</th>
              <th>Team Composition</th>
              <th>Coverage Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item, index) => {
              const isWard7 = item.ward_id === 'W7';
              return (
                <tr
                  key={item.ward_id}
                  style={{
                    background: item.partial_coverage ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
                    borderLeft: isWard7 ? '4px solid #ef4444' : 'none'
                  }}
                >
                  <td style={{ fontWeight: 800, color: index === 0 ? '#f59e0b' : '#9ca3af' }}>
                    #{index + 1}
                  </td>

                  <td>
                    <div style={{ fontWeight: 700, color: '#fff' }}>{item.ward_id}</div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{item.ward_name}</div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#60a5fa' }}>
                      {item.priority_score} / 100
                    </div>
                  </td>

                  <td>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: item.access_difficulty >= 0.6 ? '#f87171' : '#34d399' }}>
                      <Compass size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      {item.accessibility_label}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                      Difficulty Index: {item.access_difficulty}
                    </div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 700, color: '#fff' }}>{item.team_callsign}</div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'capitalize' }}>
                      {item.team_type} team (Cap: {item.team_capacity})
                    </div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 700 }}>
                      {item.assigned_responders} / {item.required_responders} Responders
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                      (Illustrative ratio: 1:25)
                    </div>
                  </td>

                  <td>
                    {item.has_medical_responder ? (
                      <span className="badge badge-success" style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                        <Ambulance size={12} /> Medical Included
                      </span>
                    ) : (
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: '#9ca3af' }}>
                        General Rescue
                      </span>
                    )}
                  </td>

                  <td>
                    {item.partial_coverage ? (
                      <span className="badge badge-danger">
                        ⚠ PARTIAL COVERAGE
                      </span>
                    ) : (
                      <span className="badge badge-success">
                        FULL COVERAGE
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
