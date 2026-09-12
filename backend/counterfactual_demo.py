"""
counterfactual_demo.py
----------------------
Demonstrates the difference in resource-allocation order between:
  (A) Naive dispatch — sort wards by raw rainfall_24h_mm descending
  (B) System dispatch — sort wards by Priority P = 0.60*H + 0.40*V

Fixed scenario: 6 wards (W1-W6, W7, W8 trimmed to 6 for demo clarity),
3 teams available, each team assigned to its top ward.

THIS SCRIPT DEMONSTRATES A CHANGE IN RESOURCE-ALLOCATION ORDER.
IT DOES NOT CLAIM A REDUCTION IN HARM.
NO LIVES-SAVED NUMBER IS IMPLIED OR STATED.
"""

import json
import sys
import os

# Windows consoles default to cp1252/CP437 which cannot encode — , → etc.
# Force UTF-8 on stdout so the table renders instead of crashing with
# UnicodeEncodeError ('charmap' codec can't encode character ...).
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(__file__))

from services import hazard_service, vulnerability_service, priority_service
from models.schemas import Ward

# ── Load data ──────────────────────────────────────────────────────────────────
with open("data/wards.json") as f:
    raw = json.load(f)

# Use exactly 6 wards for the demo (first 6 in file order, covers W1-W6)
DEMO_WARDS = raw[:6]
wards = [Ward(**w) for w in DEMO_WARDS]

TEAMS_AVAILABLE = 3

# ── NAIVE ORDER: sort by raw rainfall_24h_mm descending ───────────────────────
naive_ranked = sorted(DEMO_WARDS, key=lambda w: w["rainfall_24h_mm"], reverse=True)

# ── SYSTEM ORDER: sort by P = 0.60*H + 0.40*V ─────────────────────────────────
hazards = hazard_service.calculate_hazard(wards)
vulns   = vulnerability_service.calculate_vulnerability_and_confidence(wards)
system_ranked = priority_service.calculate_priorities_and_sizes(wards, hazards, vulns)

# Build a rainfall lookup for display
rainfall_map = {w["ward_id"]: w["rainfall_24h_mm"] for w in DEMO_WARDS}

# ── DISPLAY ────────────────────────────────────────────────────────────────────
SEP  = "-" * 80
DSEP = "=" * 80

print(DSEP)
print("COUNTERFACTUAL DEMO — Resource-Allocation Order Comparison")
print("Fixed scenario: 6 wards, 3 teams")
print()
print("NOTE: This demonstrates a change in resource-allocation ORDER.")
print("It does NOT claim a reduction in harm.")
print("No lives-saved number is implied or stated.")
print(DSEP)

# Side-by-side header
print()
print(f"{'Rank':<6} {'NAIVE (by raw rainfall)':<38} {'SYSTEM (by P = 0.60*H + 0.40*V)'}")
print(f"{'':6} {'Ward | Rainfall mm | Team?':<38} {'Ward | Priority | H | V | Conf | Team?'}")
print(SEP)

naive_assigned  = set(w["ward_id"] for w in naive_ranked[:TEAMS_AVAILABLE])
system_assigned = set(w["ward_id"] for w in system_ranked[:TEAMS_AVAILABLE])

for i in range(6):
    n = naive_ranked[i]
    s = system_ranked[i]

    n_team  = "[TEAM]" if n["ward_id"]  in naive_assigned  else ""
    s_team  = "[TEAM]" if s["ward_id"] in system_assigned else ""
    s_conf  = s.get("confidence_flag") or "ok"

    naive_col  = f"{n['ward_id']} | {n['rainfall_24h_mm']:>5} mm   | {n_team:<7}"
    system_col = (f"{s['ward_id']} | P={s['priority']:>4} "
                  f"| H={s['hazard_index']:>4} "
                  f"| V={s['vulnerability_score']:>4} "
                  f"| {s_conf:<18} | {s_team}")

    print(f"{i+1:<6} {naive_col:<38} {system_col}")

print(SEP)
print()
print("Teams dispatched under NAIVE  ordering:", sorted(naive_assigned))
print("Teams dispatched under SYSTEM ordering:", sorted(system_assigned))
print()
overlap  = naive_assigned & system_assigned
diverged = (naive_assigned | system_assigned) - overlap
print(f"Wards receiving a team under BOTH orderings   : {sorted(overlap)}")
print(f"Wards where assignment DIFFERS between orders : {sorted(diverged)}")
print()

# Explicitly call out the headline contrast
for wid in sorted(system_assigned - naive_assigned):
    ward_data = next(w for w in DEMO_WARDS if w["ward_id"] == wid)
    sys_entry = next(w for w in system_ranked if w["ward_id"] == wid)
    naive_entry = next(w for w in naive_ranked if w["ward_id"] == wid)
    naive_pos = [w["ward_id"] for w in naive_ranked].index(wid) + 1
    print(f"  SYSTEM sends a team to {wid} (P={sys_entry['priority']}, H={sys_entry['hazard_index']}, "
          f"rainfall={ward_data['rainfall_24h_mm']}mm)")
    print(f"  NAIVE would have ranked {wid} #{naive_pos} and NOT dispatched a team.")
    print(f"  Reason: high river-level + low elevation + historical frequency "
          f"(not rain alone).")
    print()

for wid in sorted(naive_assigned - system_assigned):
    ward_data = next(w for w in DEMO_WARDS if w["ward_id"] == wid)
    sys_entry = next(w for w in system_ranked if w["ward_id"] == wid)
    sys_pos   = [w["ward_id"] for w in system_ranked].index(wid) + 1
    print(f"  NAIVE sends a team to {wid} (rainfall={ward_data['rainfall_24h_mm']}mm)")
    print(f"  SYSTEM ranks {wid} #{sys_pos} (P={sys_entry['priority']}) — "
          f"team goes to a higher-need ward instead.")
    print()

print(DSEP)
print("H  = Normalized Hazard Index (0-100).  Not a probability of flooding.")
print("V  = Vulnerability score (0-100).")
print("P  = 0.60*H + 0.40*V  (weighted sum -- weights are hardcoded,")
print("     illustrative defaults, not empirically calibrated).")
print("lambda = hazard weight in edge cost -- illustrative constant, not calibrated.")
print("Q threshold for VERIFY IMMEDIATELY -- illustrative constant, not calibrated.")
print(DSEP)
