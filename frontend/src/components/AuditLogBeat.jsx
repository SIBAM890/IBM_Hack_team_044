import React from 'react';
import { History, Shield, Zap, AlertTriangle } from 'lucide-react';

export default function AuditLogBeat({ auditLogs }) {
  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
          Auditable Decision Trail & Live Re-Plan Log
        </h2>
        <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
          Every system re-plan, observation update, and road blockage toggle writes an immutable audit record for state analyst compliance and operational accountability.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History className="text-blue-400" size={18} />
          Unified Audit Event Feed ({auditLogs?.length || 0} Events)
        </h3>

        {auditLogs && auditLogs.length > 0 ? (
          <div>
            {auditLogs.map((log, idx) => {
              const isObservation = log.event === 'observation_update';
              return (
                <div key={idx} className={`audit-item ${log.event}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 700, color: isObservation ? '#60a5fa' : '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {isObservation ? <Zap size={14} /> : <AlertTriangle size={14} />}
                      EVENT: {log.event.toUpperCase()}
                    </span>
                    <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{log.timestamp}</span>
                  </div>

                  {isObservation ? (
                    <div>
                      <div>Target Ward: <strong>{log.ward_id}</strong></div>
                      <div>Priority Change: <code>{log.old_priority} → {log.new_priority}</code></div>
                      <div style={{ color: '#93c5fd', marginTop: '0.25rem' }}>Reason: {log.reason}</div>
                    </div>
                  ) : (
                    <div>
                      <div>Target Edge: <strong>{log.edge_id}</strong> (Affected Wards: {log.affected_wards?.join(", ")})</div>
                      <div>Access Difficulty Change: <code>{log.old_access_difficulty} → {log.new_access_difficulty}</code></div>
                      <div style={{ color: '#fef08a', marginTop: '0.25rem' }}>Reason: {log.reason}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
            No audit events recorded yet in this session. Trigger a road blockage in Step 5 or submit a manual observation in Step 6 to see live audit logs generate here!
          </div>
        )}
      </div>
    </div>
  );
}
