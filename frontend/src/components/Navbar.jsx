import React from 'react';
import { ShieldAlert, Activity, Database } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="app-header">
      <div>
        <div className="brand-title">
          <ShieldAlert className="w-6 h-6 text-blue-400" />
          <span>RAIC Control Room — Regional Emergency Operations</span>
        </div>
        <p className="tagline">
          Sector-level disaster response prioritization &amp; hazard-aware decision support
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#10b981' }}>
          <Activity size={16} />
          <span>Primary River Gauge: 50.4m (Danger: 48.6m)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#9ca3af' }}>
          <Database size={16} />
          <span>Monsoon Telemetry Active</span>
        </div>
      </div>
    </header>
  );
}
