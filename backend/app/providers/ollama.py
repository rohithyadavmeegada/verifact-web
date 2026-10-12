"""
VeriFact Providers — Local Ollama Client
Provides local privacy-preserving LLM inference (llama3 / mistral) on localhost:11434.
"""

from __future__ import annotations

import logging
from typing import Dict, Any, Optional
import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class OllamaClient:
    """Client for local Ollama server."""

    def __init__(self):
        self.base_url = settings.ollama_base_url.rstrip("/")
        self.model = settings.ollama_model

    async def check_health(self) -> bool:
        """Check if local Ollama daemon is reachable."""
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                return resp.status_code == 200
        except Exception:
            return False

    async def verify_claim(self, claim: str, evidence_context: str = "") -> Optional[Dict[str, Any]]:
        """Query local Ollama instance for verification."""
        prompt = (
            f"Analyze claim accuracy.\nClaim: {claim}\nEvidence: {evidence_context}\n"
            f"Output JSON with keys: verdict, trust_score (0-100), confidence (0.0-1.0), rationale."
        )
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model,
            "prompt": prompt,
            "format": "json",
            "stream": False,
        }

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    import json
                    return json.loads(data.get("response", "{}"))
        except Exception as e:
            logger.debug("Ollama local inference unavailable: %s", e)

        return None
