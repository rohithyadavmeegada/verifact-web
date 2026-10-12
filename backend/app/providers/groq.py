"""
VeriFact Providers — Groq API Client
Provides ultra-low-latency verification inference with Llama 3 on Groq LPUs.
"""

from __future__ import annotations

import logging
from typing import Dict, Any, Optional
import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class GroqClient:
    """Client for Groq OpenAI-compatible fast inference API."""

    def __init__(self):
        self.api_key = settings.groq_api_key
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
        self.model = "llama-3.3-70b-versatile"

    async def verify_claim(self, claim: str, evidence_context: str = "") -> Optional[Dict[str, Any]]:
        """Query Groq to evaluate factual integrity."""
        if not self.api_key:
            return None

        prompt = (
            f"You are a rigorous research fact-checker for VeriFact.\n"
            f"Analyze the claim against known facts and evidence.\n\n"
            f"Claim: \"{claim}\"\n"
            f"Evidence: {evidence_context or 'None provided.'}\n\n"
            f"Respond STRICTLY in JSON format with keys:\n"
            f'{{"verdict": "LIKELY_RELIABLE"|"LIKELY_FALSE"|"UNVERIFIABLE"|"INSUFFICIENT_EVIDENCE", '
            f'"trust_score": 0-100, "confidence": 0.0-1.0, "rationale": "...", "key_facts": ["..."]}}'
        )

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are a professional fact-checker producing strict JSON."},
                {"role": "user", "content": prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(self.base_url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    import json
                    return json.loads(content)
                else:
                    logger.warning("Groq API error %s: %s", resp.status_code, resp.text[:200])
        except Exception as e:
            logger.warning("Groq call exception: %s", e)

        return None
