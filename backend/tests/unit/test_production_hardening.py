"""
VeriFact Backend — Production Hardening & Negative Tests Suite
Tests database readiness, negative cases, security filters, and experiment pipelines.
"""

import io
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_readiness_probe():
    """Verify production /api/ready probe reports healthy database connectivity."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        res = await client.get("/api/ready")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ready"
        assert data["ready"] is True


@pytest.mark.asyncio
async def test_health_check_database_latency():
    """Verify /api/health probes live database and returns numeric latency."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        res = await client.get("/api/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"
        assert data["database"]["status"] == "connected"
        assert isinstance(data["database"]["latency_ms"], (int, float))
        assert data["database"]["latency_ms"] >= 0


@pytest.mark.asyncio
async def test_unauthenticated_request_rejected():
    """Verify protected endpoints return 401 when Authorization header is absent."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        res = await client.post("/api/v1/analyze/text", json={"claim": "Unauthenticated test"})
        assert res.status_code in [401, 403]


@pytest.mark.asyncio
async def test_invalid_request_schema_rejected():
    """Verify malformed requests return 422 Unprocessable Entity."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        guest_res = await client.post("/api/v1/auth/guest")
        token = guest_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Empty body where schema requires 'claim'
        res = await client.post("/api/v1/analyze/text", json={}, headers=headers)
        assert res.status_code == 422


@pytest.mark.asyncio
async def test_image_upload_mime_type_validation():
    """Verify uploading non-image file is rejected with 400 Bad Request."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        guest_res = await client.post("/api/v1/auth/guest")
        token = guest_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        files = {"image": ("malicious.sh", b"#!/bin/bash\necho hack", "text/plain")}
        res = await client.post("/api/v1/analyze/image", files=files, headers=headers)
        assert res.status_code == 400
        assert "Unsupported image type" in res.json()["detail"]


@pytest.mark.asyncio
async def test_image_upload_magic_bytes_spoofing_rejected():
    """Verify file with image/png MIME but forged text content is rejected by magic-byte check."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        guest_res = await client.post("/api/v1/auth/guest")
        token = guest_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        files = {"image": ("fake.png", b"This is not a real PNG file header", "image/png")}
        res = await client.post("/api/v1/analyze/image", files=files, headers=headers)
        assert res.status_code == 400
        assert "File signature does not match" in res.json()["detail"]


@pytest.mark.asyncio
async def test_valid_image_upload_processed():
    """Verify real valid PNG image is accepted and forensics analysis succeeds."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        guest_res = await client.post("/api/v1/auth/guest")
        token = guest_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1x1 transparent PNG binary bytes
        png_1x1 = (
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
            b"\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05"
            b"\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
        )
        files = {"image": ("sample.png", png_1x1, "image/png")}
        data = {"caption": "Scientific test specimen", "claim": "Sample authenticated image"}

        res = await client.post("/api/v1/analyze/image", files=files, data=data, headers=headers)
        assert res.status_code == 200
        body = res.json()
        assert body["status"] == "completed"
        assert body["vision_result"] is not None
        assert body["vision_result"]["modality"] == "vision"


@pytest.mark.asyncio
async def test_feedback_submission_and_persistence():
    """Verify users can submit audit feedback on completed analyses."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        guest_res = await client.post("/api/v1/auth/guest")
        token = guest_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Run analysis
        claim_payload = {"claim": "James Webb Space Telescope detects methane on exoplanet K2-18b."}
        analysis_res = await client.post("/api/v1/analyze/text", json=claim_payload, headers=headers)
        assert analysis_res.status_code == 200
        analysis_id = analysis_res.json()["id"]

        # 2. Submit feedback
        feedback_payload = {
            "is_correct": True,
            "rating": 5,
            "comment": "Accurate retrieval and scientific stance classification."
        }
        fb_res = await client.post(f"/api/v1/analyze/{analysis_id}/feedback", json=feedback_payload, headers=headers)
        assert fb_res.status_code == 200
        fb_data = fb_res.json()
        assert fb_data["status"] == "success"
        assert fb_data["analysis_id"] == analysis_id


@pytest.mark.asyncio
async def test_research_experiment_creation_and_metrics():
    """Verify research ablation experiment execution calculates genuine empirical metrics."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        guest_res = await client.post("/api/v1/auth/guest")
        token = guest_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        exp_payload = {
            "name": "DeBERTa-RAG-Fusion-Ablation-Run-1",
            "description": "Controlled benchmark on LIAR dataset",
            "pipeline_components": ["text_deberta", "evidence_rag", "xgboost_fusion"],
            "random_seed": 42
        }
        res = await client.post("/api/v1/research/experiments", json=exp_payload, headers=headers)
        assert res.status_code == 200
        exp_data = res.json()
        assert exp_data["status"] == "completed"
        assert exp_data["metrics"]["accuracy"] > 0.80
        assert exp_data["metrics"]["macro_f1"] > 0.80
        assert exp_data["metrics"]["brier_score"] < 0.20
        assert "p50_latency_ms" in exp_data["metrics"]
        assert len(exp_data["confusion_matrix"]) == 2


@pytest.mark.asyncio
async def test_rate_limiting_headers_injected():
    """Verify rate-limiting middleware injects limit and remaining headers."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        res = await client.get("/api/v1/config/public")
        assert res.status_code == 200
        assert "X-RateLimit-Limit" in res.headers
        assert "X-RateLimit-Remaining" in res.headers
