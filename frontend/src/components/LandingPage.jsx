import React from 'react';

export default function LandingPage({ onLaunchDashboard, wardsCount, roadBlocked }) {
  return (
    <div className="landing-page-root">
      {/* Hero Section — Full-Bleed Atmospheric Tactical Map Background */}
      <section className="landing-hero-fullbleed">
        {/* Atmospheric Tactical Map Background Layer */}
        <div className="hero-bg-map-layer">
          <img 
            src="/illustrations/tactical_gis_map.jpg" 
            alt="Tactical Inundation GIS Map" 
            className="hero-bg-map-img" 
          />
          <div className="hero-bg-overlay"></div>
        </div>

        {/* Foreground Content */}
        <div className="landing-hero-content-center">
          <div className="landing-badge">
            <span className="badge-dot"></span>
            District Emergency Operations | Urban Inundation Model
          </div>
          <h1 className="landing-title-centered">
            Risk Assessment &amp; Incident Control
          </h1>
          <p className="landing-subtitle-centered">
            Lightweight, explainable disaster risk prioritization and multi-criteria response planning system for district emergency control rooms.
          </p>
          
          <div className="landing-cta-group-centered">
            <button 
              className="landing-btn landing-btn-primary"
              onClick={onLaunchDashboard}
            >
              Launch Control Room Dashboard &rarr;
            </button>
            <a 
              href="http://localhost:8000/docs" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="landing-btn landing-btn-secondary"
            >
              View OpenAPI Docs &#8599;
            </a>
          </div>
        </div>
      </section>

      {/* Main Content Body */}
      <div className="landing-body-container">
        {/* Operational Risk Comparison Section */}
        <section className="landing-comparison-section">
        <div className="section-header-center">
          <span className="section-kicker">HUMAN OPERATIONAL RISK MODEL</span>
          <h2 className="landing-section-title">
            Why Manual Emergency Coordination Fails vs How RAIC Solves It
          </h2>
          <p className="section-lead">
            In sudden urban inundations, intuition and manual call sheets lead to tragic dispatches. RAIC enforces transparent multi-criteria mathematics and automated route verification.
          </p>
        </div>

        <div className="comparison-grid">
          {/* Card 1: Subjective Prioritization */}
          <div className="op-card">
            <div className="op-card-header">
              <div className="op-card-icon icon-indigo">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
                  <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
                  <path d="M7 21h10"/>
                  <path d="M12 3v18"/>
                  <path d="M3 7h18"/>
                </svg>
              </div>
              <span className="op-tag tag-formula">FORMULA DRIVEN</span>
            </div>

            <h3 className="op-card-title">Subjective Prioritization</h3>

            <div className="op-block block-fail">
              <div className="op-block-label label-fail">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                MANUAL FAILURE
              </div>
              <p className="op-block-text">
                Dispatching teams based on who yells loudest on phone lines, completely ignoring silent submerged zones cut off from communications.
              </p>
            </div>

            <div className="op-block block-solve">
              <div className="op-block-label label-solve">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                HOW RAIC SOLVES IT
              </div>
              <p className="op-block-text">
                Multi-criteria formula <code>P = 0.60·H + 0.40·V</code> where low elevation and river stage override panic calls.
              </p>
            </div>
          </div>

          {/* Card 2: Stale Telemetry Blindspots */}
          <div className="op-card">
            <div className="op-card-header">
              <div className="op-card-icon icon-amber">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>
                  <path d="M12 8v4"/>
                  <path d="M12 16h.01"/>
                </svg>
              </div>
              <span className="op-tag tag-warning">QUALITY GUARD</span>
            </div>

            <h3 className="op-card-title">Stale Telemetry Blindspots</h3>

            <div className="op-block block-fail">
              <div className="op-block-label label-fail">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                MANUAL FAILURE
              </div>
              <p className="op-block-text">
                Treating dead or silent river sensors as safe, deprioritizing unmonitored wards due to lack of recent automated alerts.
              </p>
            </div>

            <div className="op-block block-solve">
              <div className="op-block-label label-solve">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                HOW RAIC SOLVES IT
              </div>
              <p className="op-block-text">
                Telemetry age <code>Q &gt; 12h</code> triggers bold <span className="highlight-badge-warn">VERIFY IMMEDIATELY</span> flag without lowering priority numbers.
              </p>
            </div>
          </div>

          {/* Card 3: Guessed Team Sizing */}
          <div className="op-card">
            <div className="op-card-header">
              <div className="op-card-icon icon-emerald">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <span className="op-tag tag-capacity">DETERMINISTIC CAPACITY</span>
            </div>

            <h3 className="op-card-title">Guessed Team Sizing</h3>

            <div className="op-block block-fail">
              <div className="op-block-label label-fail">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                MANUAL FAILURE
              </div>
              <p className="op-block-text">
                Arbitrary unit deployments sending 3-person squads to 40,000+ population flood zones, risking responder entrapment.
              </p>
            </div>

            <div className="op-block block-solve">
              <div className="op-block-label label-solve">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                HOW RAIC SOLVES IT
              </div>
              <p className="op-block-text">
                Deterministic 1 responder per 25 civilians ratio with automated <span className="highlight-badge-alert">PARTIAL COVERAGE</span> capacity deficit alerts.
              </p>
            </div>
          </div>

          {/* Card 4: Blind Road Navigation */}
          <div className="op-card">
            <div className="op-card-header">
              <div className="op-card-icon icon-rose">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="6" cy="19" r="3"/>
                  <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/>
                  <circle cx="18" cy="5" r="3"/>
                </svg>
              </div>
              <span className="op-tag tag-route">DIJKSTRA ROUTING</span>
            </div>

            <h3 className="op-card-title">Blind Road Navigation</h3>

            <div className="op-block block-fail">
              <div className="op-block-label label-fail">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                MANUAL FAILURE
              </div>
              <p className="op-block-text">
                Rescue vehicles taking shortest geographic Google Maps routes straight into submerged underpasses and severed bypass bridges.
              </p>
            </div>

            <div className="op-block block-solve">
              <div className="op-block-label label-solve">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                HOW RAIC SOLVES IT
              </div>
              <p className="op-block-text">
                Two-tier hazard-penalized Dijkstra routing with live fallback dispatches when primary corridors (e.g., E12) sever.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Target Scenario Focus */}
      <section className="landing-scenario">
        <div className="scenario-card">
          <div className="scenario-header">
            <span className="scenario-tag">DISTRICT CONTROL ROOM SCENARIO</span>
            <h3>District Urban &amp; Lowland Inundation Model</h3>
          </div>
          <p className="scenario-desc">
            Equips emergency commanders with actionable priorities: Where to rescue first, exact population &amp; demographic breakdown, assigned SDRF/NDRF team capacities, and safe hazard-aware corridors.
          </p>
          <div className="scenario-actions">
            <button className="landing-btn landing-btn-primary" onClick={onLaunchDashboard}>
              Open Command Control Room
            </button>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
