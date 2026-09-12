import React, { useState } from 'react';
import { Send, CheckCircle2, RefreshCw, Zap } from 'lucide-react';
import { postObservation } from '../api';

export default function ObservationBeat({ wards, onStateChange }) {
  const [selectedWard, setSelectedWard] = useState('W5');
  const [count, setCount] = useState(35);
  const [loading, setLoading] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await postObservation({
        ward_id: selectedWard,
        detected_people_count: parseInt(count, 10),
        confidence: 0.85,
        source_type: "manual_entry"
      });
      setLastSubmitted(res);
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
          Live Field Observation Feedback Loop
        </h2>
        <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
          Submitting a ground observation updates observed assistance count, recalculates Vulnerability (V) and Priority (P), triggers team re-sizing, and streams an auditable log event live.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '450px 1fr', gap: '1.5rem' }}>
        {/* Form Card */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap className="text-blue-400" size={18} />
            Field Observation Entry Form
          </h3>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.85rem', color: '#9ca3af', display: 'block', marginBottom: '0.4rem' }}>Select Target Ward:</label>
              <select className="form-select" value={selectedWard} onChange={(e) => setSelectedWard(e.target.value)}>
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.id} - {w.name} (Current Priority: {w.priority_score})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: '#9ca3af', display: 'block', marginBottom: '0.4rem' }}>
                Observed Assistance Count (People needing rescue):
              </label>
              <input
                type="number"
                className="form-input"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                min="1"
                required
              />
              <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.3rem', display: 'block' }}>
                Overrides default population estimate for responder team sizing.
              </span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              <Send size={16} /> Submit Observation & Re-Plan Live
            </button>
          </form>
        </div>

        {/* Live Re-Plan Feedback Result Panel */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
            Live System Re-Planning Output
          </h3>

          {lastSubmitted ? (
            <div>
              <div className="alert-amber" style={{ marginBottom: '1.5rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399' }}>
                <CheckCircle2 size={20} />
                <div>
                  <strong>Live Re-Plan Complete!</strong> Ward {lastSubmitted.audit_event.ward_id} priority updated live from {lastSubmitted.audit_event.old_priority} → {lastSubmitted.audit_event.new_priority}.
                </div>
              </div>

              <div style={{ background: 'rgba(11, 15, 25, 0.8)', padding: '1rem', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#60a5fa' }}>
                <div style={{ color: '#9ca3af', marginBottom: '0.5rem' }}>Generated Audit Event:</div>
                <pre style={{ overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(lastSubmitted.audit_event, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#9ca3af', textAlign: 'center' }}>
              <RefreshCw size={32} style={{ opacity: 0.5, marginBottom: '0.75rem' }} />
              <p style={{ fontSize: '0.9rem' }}>Submit an observation above to watch priority, team sizing, and audit logs update live.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
