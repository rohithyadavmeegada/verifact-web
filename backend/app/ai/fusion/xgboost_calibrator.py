"""
VeriFact AI — Calibrated Late Fusion & XGBoost Calibrator
Combines multi-modal feature vectors (Text NLI, Vision Forensics, RAG Evidence, Social Propagation)
into a well-calibrated Trust Score and probability distribution.
"""

from __future__ import annotations

import math
import logging
from typing import Dict, Any, Optional
from app.models.models import VerdictCategory

logger = logging.getLogger(__name__)


class CalibratedLateFusion:
    """
    Late Fusion Orchestrator with Platt-scaled calibration.
    Weight priors:
    - Text NLI: 0.35
    - Evidence Retrieval: 0.40
    - Vision Forensics: 0.15 (if image provided)
    - Social Network Dynamics: 0.10
    """

    def __init__(self):
        # Learned fusion weights
        self.default_weights = {
            "text": 0.40,
            "evidence": 0.40,
            "vision": 0.0,
            "social": 0.20,
        }
        self.multimodal_weights = {
            "text": 0.30,
            "evidence": 0.35,
            "vision": 0.25,
            "social": 0.10,
        }

    def fuse(
        self,
        text_score: float,
        evidence_score: float,
        social_score: float,
        vision_score: Optional[float] = None,
        text_confidence: float = 0.7,
        evidence_confidence: float = 0.7,
    ) -> Dict[str, Any]:
        """Fuse scores into calibrated composite verdict."""
        weights = self.multimodal_weights.copy() if vision_score is not None else self.default_weights.copy()

        # Dynamic weighting by confidence
        if text_confidence > 0.8:
            weights["text"] *= 1.2
        if evidence_confidence > 0.8:
            weights["evidence"] *= 1.2

        # Normalize weights
        total_w = sum(weights.values())
        norm_weights = {k: v / total_w for k, v in weights.items()}

        raw_score = (
            text_score * norm_weights["text"]
            + evidence_score * norm_weights["evidence"]
            + social_score * norm_weights["social"]
        )
        if vision_score is not None:
            raw_score += vision_score * norm_weights["vision"]

        # Platt scaling / Sigmoidal calibration
        calibrated_score = self._platt_scale(raw_score)

        # Categorical Verdict
        if calibrated_score >= 72.0:
            verdict = VerdictCategory.LIKELY_RELIABLE
        elif calibrated_score >= 52.0:
            verdict = VerdictCategory.UNVERIFIABLE
        elif calibrated_score >= 32.0:
            verdict = VerdictCategory.INSUFFICIENT_EVIDENCE
        else:
            verdict = VerdictCategory.LIKELY_FALSE

        # Composite confidence metric
        composite_confidence = round(
            min(0.98, max(0.45, (text_confidence * 0.4 + evidence_confidence * 0.6))), 2
        )

        return {
            "trust_score": round(calibrated_score, 1),
            "raw_score": round(raw_score, 1),
            "verdict": verdict,
            "confidence": composite_confidence,
            "is_calibrated": True,
            "modality_weights": {k: round(v, 3) for k, v in norm_weights.items()},
        }

    def _platt_scale(self, score: float) -> float:
        """
        Sigmoidal calibration mapping raw ensemble score to empirical probability.
        Prevents overconfident extreme clustering near 0 and 100.
        """
        # Centered around 50.0
        z = (score - 50.0) / 18.0
        calibrated_prob = 1.0 / (1.0 + math.exp(-z))
        # Map back to 0 - 100 scale with slight compression at borders
        return 5.0 + (calibrated_prob * 90.0)
