"""
VeriFact Providers — Google Gemini API Client
Integrates Gemini 1.5 Flash / Pro for multimodal claim verification reasoning.
"""

from __future__ import annotations

import logging
from typing import Dict, Any, Optional
import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class GeminiClient:
    """Client for Google Gemini multimodal reasoning API."""

    def __init__(self):
        self.api_key = settings.gemini_api_key
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"
        self.model = "gemini-1.5-flash"

    async def verify_claim(self, claim: str, evidence_context: str = "") -> Optional[Dict[str, Any]]:
        """Query Gemini to analyze factual consistency and truthfulness."""
        if not self.api_key:
            return None

        prompt = (
            f"You are a rigorous scientific fact-checker for the VeriFact research platform.\n"
            f"Analyze the following claim against the provided evidence.\n\n"
            f"Claim: \"{claim}\"\n"
            f"Evidence Context: {evidence_context or 'None provided.'}\n\n"
            f"Respond in JSON format with:\n"
            f"- verdict: one of ['LIKELY_RELIABLE', 'LIKELY_FALSE', 'UNVERIFIABLE', 'INSUFFICIENT_EVIDENCE']\n"
            f"- trust_score: integer from 0 to 100\n"
            f"- confidence: float from 0.0 to 1.0\n"
            f"- rationale: 2-3 concise sentences explaining the factual stance\n"
            f"- key_facts: list of 2-3 verified factual assertions"
        )

        url = f"{self.base_url}/{self.model}:generateContent?key={self.api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"}
        }

        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text_part = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        import json
                        return json.loads(text_part)
                else:
                    logger.warning("Gemini API error status %s: %s", resp.status_code, resp.text[:200])
        except Exception as e:
            logger.warning("Gemini call exception: %s", e)

        return None
