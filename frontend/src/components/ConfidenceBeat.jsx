import React from 'react';
import { AlertCircle, Clock, ShieldAlert, Eye } from 'lucide-react';

export default function ConfidenceBeat({ wards }) {
  const w3 = wards.find(w => w.id === 'W3') || wards[2];

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
          Data Confidence (Q) & Verification Safety Flag
        </h2>
        <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
          Safety Guarantee: Stale or unmonitored data <strong>NEVER lowers priority score (P)</strong>. Instead, low confidence elevates operator attention via a bright visual verification alert.
        </p>
      </div>

      {/* Featured Spotlight Card for Ward 3 */}
      <div className="glass-panel" style={{ padding: '2rem', borderLeft: '6px solid #f59e0b', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <span className="badge badge-warning" style={{ marginBottom: '0.5rem' }}>
              STALE SENSOR DETECTED (14 HOURS AGO)
            </span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
              {w3?.name || "Ward 3 (Digha Ghat Zone)"}
            </h3>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Calculated Priority Score</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#60a5fa' }}>
              {w3?.priority_score || 82.0} / 100
            </div>
          </div>
        </div>

        {/* Verbatim Alert Box Treatment */}
        <div className="alert-amber" style={{ fontSize: '1.1rem', padding: '1.25rem', borderRadius: '10px', marginBottom: '1.5rem' }}>
          <AlertCircle size={28} />
          <div>
            <strong>Required Operational Warning:</strong><br />
            <code>Priority: {w3?.priority_score || 82}, Confidence: LOW ({w3?.confidence_reason || "river level last updated 14h ago"}) — VERIFY IMMEDIATELY</code>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', background: 'rgba(11, 15, 25, 0.8)', padding: '1.25rem', borderRadius: '8px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={14} /> Sensor Freshness
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f87171', marginTop: '0.2rem' }}>
              14 Hours Stale
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldAlert size={14} /> Mathematical Impact
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981', marginTop: '0.2rem' }}>
              P Unreduced (P=82.0)
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Eye size={14} /> Required Action
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fbbf24', marginTop: '0.2rem' }}>
              Dispatch Scout / Recalculate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
