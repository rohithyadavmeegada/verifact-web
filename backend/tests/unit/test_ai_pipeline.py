"""
Unit tests for VeriFact AI multimodal submodules.
"""

import io
import pytest
from PIL import Image

from app.ai.text.claim_analyzer import ClaimAnalyzer
from app.ai.vision.image_forensics import ImageForensics
from app.ai.social.graph_analyzer import SocialGraphAnalyzer
from app.ai.fusion.xgboost_calibrator import CalibratedLateFusion
from app.ai.explainability.xai_engine import XAIEngine
from app.models.models import VerdictCategory


def test_claim_analyzer_heuristic():
    analyzer = ClaimAnalyzer()
    res = analyzer.analyze_claim(
        claim="Shocking secret miracle cure exposed!",
        evidence_texts=["This medical claim was debunked and found to be false and a hoax."],
    )
    assert "score" in res
    assert res["score"] < 50.0  # Should be flagged as low trust
    assert res["nli_label"] == "contradiction"
    assert len(res["token_attributions"]) > 0


def test_claim_analyzer_supporting():
    analyzer = ClaimAnalyzer()
    res = analyzer.analyze_claim(
        claim="A study published in Nature confirmed the discovery.",
        evidence_texts=["Reuters confirmed official verified study published in scientific reports."],
    )
    assert res["score"] > 60.0
    assert res["nli_label"] == "entailment"


def test_image_forensics_ela():
    forensics = ImageForensics()
    # Create simple in-memory image
    img = Image.new("RGB", (100, 100), color=(255, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    res = forensics.analyze_image(buf.getvalue(), caption="Red square")
    assert "score" in res
    assert "ela_anomaly_score" in res
    assert res["image_dimensions"] == "100x100"


def test_social_graph_analyzer():
    analyzer = SocialGraphAnalyzer()
    res = analyzer.analyze_social_context("Viral breaking news claim", source_url="https://example.com/claim")
    assert "bot_velocity_ratio" in res
    assert "clustering_coefficient" in res
    assert "graph_visualization" in res
    assert len(res["graph_visualization"]["nodes"]) > 0


def test_calibrated_late_fusion():
    fusion = CalibratedLateFusion()
    out = fusion.fuse(
        text_score=85.0,
        evidence_score=90.0,
        social_score=80.0,
        vision_score=None,
    )
    assert out["trust_score"] > 70.0
    assert out["verdict"] == VerdictCategory.LIKELY_RELIABLE
    assert out["is_calibrated"] is True


def test_xai_engine():
    engine = XAIEngine()
    exp = engine.generate_explanation(
        claim="Claim about climate report",
        verdict="LIKELY_RELIABLE",
        trust_score=88.5,
        modality_weights={"text": 0.4, "evidence": 0.4, "social": 0.2},
        text_result={"nli_label": "entailment", "token_attributions": [{"token": "climate", "weight": 0.3}]},
        evidence_count=3,
    )
    assert "summary" in exp
    assert "modality_contributions" in exp
    assert len(exp["limitations"]) > 0
