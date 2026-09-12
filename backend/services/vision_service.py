"""
Optional YOLOv8n module — isolated so it can be cut without breaking anything else.

This service is OPTIONAL ENRICHMENT ONLY. The POST /observation endpoint works
fully with manual_entry source_type regardless of whether this service is available.

If YOLOv8n is available, it can provide a detected_people_count to pre-fill the
observation payload — but the operator still reviews and submits it manually.

Per §11 non-goals: not claiming real drone hardware or operational-grade aerial detection.
"""
from typing import Optional, Dict, Any


def detect_people_in_image(image_ref: Optional[str]) -> Dict[str, Any]:
    """
    Simulated YOLOv8n detection on a sample image.
    Returns a count and confidence suitable for feeding into POST /observation.

    In a real deployment, this would:
      1. Load the image from image_ref path or URL.
      2. Run ultralytics YOLOv8n inference.
      3. Filter detections by class 'person'.
      4. Return count and mean confidence.

    For this prototype, this function is a stub that returns simulated output.
    Cut this entire service if behind schedule — it has zero coupling to the
    core scoring/routing pipeline.
    """
    if image_ref is None:
        return {
            "available": False,
            "reason": "No image_ref provided. Use manual_entry source_type."
        }

    # Simulated detection output (not real inference)
    simulated_count = 12
    simulated_confidence = 0.71

    return {
        "available": True,
        "source": "simulated_yolov8n",
        "detected_people_count": simulated_count,
        "confidence": simulated_confidence,
        "note": (
            "Simulated output only — not a real drone feed. "
            "Use as optional enrichment to pre-fill POST /observation. "
            "Operator must confirm before submission."
        )
    }
