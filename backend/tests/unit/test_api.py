"""
VeriFact Backend — API Unit Tests
Tests auth, analysis, research, and health endpoints.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_health_check():
    """Verify public health check endpoint."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["version"] == "1.0.0"


@pytest.mark.asyncio
async def test_public_config():
    """Verify public configuration endpoint."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/api/v1/config/public")
        assert response.status_code == 200
        data = response.json()
        assert "demo_mode" in data
        assert "providers" in data
        assert "features" in data


@pytest.mark.asyncio
async def test_google_auth_workflow():
    """Verify Google authentication endpoint with token and profile."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        payload = {
            "token": "dev_google_token",
            "email": "test.google@verifact.ai",
            "name": "Test Google User",
        }
        res = await client.post("/api/v1/auth/google", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["access_token"] is not None
        assert data["user"]["email"] == "test.google@verifact.ai"
        assert data["user"]["role"] == "user"


@pytest.mark.asyncio
async def test_guest_login_and_claim_analysis():
    """Verify guest session creation and text claim analysis workflow."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # 1. Guest login
        guest_res = await client.post("/api/v1/auth/guest")
        assert guest_res.status_code == 200
        guest_data = guest_res.json()
        token = guest_data["access_token"]
        assert token is not None
        assert guest_data["user"]["is_demo"] is False

        headers = {"Authorization": f"Bearer {token}"}

        # 2. Check session
        session_res = await client.get("/api/v1/auth/session", headers=headers)
        assert session_res.status_code == 200
        assert session_res.json()["email"] == guest_data["user"]["email"]

        # 3. Submit text claim analysis
        claim_payload = {
            "claim": "NASA discovered liquid water oceans beneath Europa's icy crust."
        }
        analyze_res = await client.post(
            "/api/v1/analyze/text", json=claim_payload, headers=headers
        )
        assert analyze_res.status_code == 200
        result = analyze_res.json()
        assert result["status"] == "completed"
        assert result["trust_score"] is not None
        assert result["verdict"] in [
            "likely_reliable",
            "unverifiable",
            "likely_false",
            "satire",
            "insufficient_evidence",
        ]
        assert len(result["evidence_items"]) > 0
        assert result["is_demo"] is False

        # 4. Check analysis history
        history_res = await client.get("/api/v1/history", headers=headers)
        assert history_res.status_code == 200
        history = history_res.json()
        assert len(history) >= 1
        assert history[0]["id"] == result["id"]

        # 5. Check research datasets
        datasets_res = await client.get("/api/v1/research/datasets", headers=headers)
        assert datasets_res.status_code == 200
        datasets = datasets_res.json()
        assert len(datasets) >= 5
