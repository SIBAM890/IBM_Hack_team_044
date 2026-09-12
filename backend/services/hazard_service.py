"""
Answers Q1: Where will it occur?
Calculates the Hazard Index (H).
H_flood = 0.35·R + 0.30·L + 0.20·E + 0.15·F
"""

def calculate_hazard(wards):
    # Calculate R (Rainfall)
    # L (River Level)
    # E (Elevation Susceptibility)
    # F (Historical Frequency)

    DANGER_LEVEL_M = 48.6

    # Collect raw values for normalization
    raw_R = [w.rainfall_24h_mm + w.rainfall_forecast_48h_mm for w in wards]
    raw_F = [w.historical_flood_count_10y for w in wards]

    min_R = min(raw_R)
    max_R = max(raw_R)
    
    min_F = min(raw_F)
    max_F = max(raw_F)

    results = []

    for w in wards:
        # R = rainfall_norm (recent + forecast rainfall), min-max
        total_rainfall = w.rainfall_24h_mm + w.rainfall_forecast_48h_mm
        r_norm = (total_rainfall - min_R) / (max_R - min_R) if max_R > min_R else 0

        # L = river_level_norm (river_level_m / danger_level_m, capped at 1.2, then min-max)
        # Actually PRD says "capped at 1.2, then min-max". But what are the min-max bounds?
        # Let's min-max across the wards
        pass # will compute L properly later

    # Wait, it's easier to compute all raw Ls first
    raw_L_capped = [min(1.2, w.river_level_m / DANGER_LEVEL_M) for w in wards]
    min_L = min(raw_L_capped)
    max_L = max(raw_L_capped)

    for i, w in enumerate(wards):
        total_rainfall = w.rainfall_24h_mm + w.rainfall_forecast_48h_mm
        r_norm = (total_rainfall - min_R) / (max_R - min_R) if max_R > min_R else 0
        
        l_capped = raw_L_capped[i]
        l_norm = (l_capped - min_L) / (max_L - min_L) if max_L > min_L else 0

        # E = low_elevation_susceptibility_norm (from SRTM; inverted so lower elevation = higher score)
        # Assuming the field low_elevation_susceptibility is already 0-1 where 1 means very susceptible.
        e_norm = w.low_elevation_susceptibility

        f_raw = w.historical_flood_count_10y
        f_norm = (f_raw - min_F) / (max_F - min_F) if max_F > min_F else 0

        h_index = 0.35 * r_norm + 0.30 * l_norm + 0.20 * e_norm + 0.15 * f_norm
        h_score = round(h_index * 100, 1)

        breakdown = {
            "R": round(0.35 * r_norm * 100, 1),
            "L": round(0.30 * l_norm * 100, 1),
            "E": round(0.20 * e_norm * 100, 1),
            "F": round(0.15 * f_norm * 100, 1)
        }

        results.append({
            "ward_id": w.ward_id,
            "hazard_index": h_score,
            "breakdown": breakdown,
            "label": "Normalized Hazard Index — decision support only, not a probability of flooding."
        })
    
    # Sort by hazard_index descending
    results.sort(key=lambda x: x["hazard_index"], reverse=True)
    return results
