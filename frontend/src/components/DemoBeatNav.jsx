import React from 'react';

export const DEMO_BEATS = [
  { id: 1, label: "1. Hazard Map & Breakdown", subtitle: "Where will it occur?" },
  { id: 2, label: "2. Vulnerability Contrast", subtitle: "Who/what is affected?" },
  { id: 3, label: "3. Confidence Proof", subtitle: "VERIFY IMMEDIATELY flag" },
  { id: 4, label: "4. Priority & Assignments", subtitle: "Who responds first?" },
  { id: 5, label: "5. Hazard-Aware Routing", subtitle: "Safest/fastest route?" },
  { id: 6, label: "6. Manual Observation", subtitle: "Live re-plan trigger" },
  { id: 7, label: "7. Audit Trail Feed", subtitle: "System decision log" },
];

export default function DemoBeatNav({ activeBeat, setActiveBeat }) {
  return (
    <div className="demo-stepper">
      {DEMO_BEATS.map((beat) => (
        <button
          key={beat.id}
          className={`step-tab ${activeBeat === beat.id ? 'active' : ''}`}
          onClick={() => setActiveBeat(beat.id)}
        >
          <span className="step-num">{beat.id}</span>
          <div style={{ textAlign: 'left' }}>
            <div>{beat.label}</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.75 }}>{beat.subtitle}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
