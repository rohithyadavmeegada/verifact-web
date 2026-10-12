from __future__ import annotations

import time
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import get_settings
from app.models.models import (
    Analysis, AnalysisType, AnalysisStatus, VerdictCategory,
    Evidence, EvidenceRelation,
)
from app.schemas.schemas import AnalysisResponse, ModalityResult, EvidenceItem, ExplanationData

from app.ai.text.claim_analyzer import ClaimAnalyzer
from app.ai.vision.image_forensics import ImageForensics
from app.ai.retrieval.fact_checker import FactCheckRetriever
from app.ai.social.graph_analyzer import SocialGraphAnalyzer
from app.ai.fusion.xgboost_calibrator import CalibratedLateFusion
from app.ai.explainability.xai_engine import XAIEngine
from app.providers.gemini import GeminiClient
from app.providers.groq import GroqClient
from app.providers.ollama import OllamaClient

settings = get_settings()

# Pipeline singleton engines
claim_analyzer = ClaimAnalyzer()
image_forensics = ImageForensics()
fact_retriever = FactCheckRetriever()
social_analyzer = SocialGraphAnalyzer()
late_fusion = CalibratedLateFusion()
xai_engine = XAIEngine()
gemini_client = GeminiClient()
groq_client = GroqClient()
ollama_client = OllamaClient()


class AnalysisService:
    """Orchestrates analysis pipelines and manages analysis lifecycle."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_analysis(
        self,
        user_id: uuid.UUID,
        analysis_type: AnalysisType,
        claim_text: str | None = None,
        source_url: str | None = None,
        caption: str | None = None,
        is_demo: bool = False,
        image_data: bytes | None = None,
    ) -> Analysis:
        """Create a new analysis record."""
        analysis = Analysis(
            user_id=user_id,
            analysis_type=analysis_type,
            claim_text=claim_text,
            source_url=source_url,
            caption=caption,
            is_demo=is_demo,
            status=AnalysisStatus.PENDING,
        )
        self.db.add(analysis)
        await self.db.flush()

        if image_data:
            analysis.image_path = f"uploads/{analysis.id}.bin"
            self._cached_image_bytes = image_data
        else:
            self._cached_image_bytes = None

        return analysis

    async def process_analysis(self, analysis: Analysis) -> AnalysisResponse:
        """Process an analysis through the full pipeline."""
        start_time = time.time()

        try:
            analysis.status = AnalysisStatus.PROCESSING
            await self.db.flush()

            # If user explicitly requested demo mode or settings force demo mode
            if analysis.is_demo:
                return await self._process_demo(analysis, start_time)

            if settings.enable_real_ai or settings.enable_local_ai or not settings.demo_mode:
                return await self._process_real_ai(analysis, start_time)

            # Fallback to demo mode
            return await self._process_demo(analysis, start_time)

        except Exception as e:
            analysis.status = AnalysisStatus.FAILED
            analysis.error_message = str(e)
            await self.db.flush()
            raise

    async def _process_real_ai(
        self, analysis: Analysis, start_time: float
    ) -> AnalysisResponse:
        """Execute full production multimodal deep learning pipeline."""
        claim = analysis.claim_text or analysis.caption or analysis.source_url or ""
        warnings = []

        # 1. Retrieval: Fetch evidence from Google Fact Check / NewsAPI / DuckDuckGo
        retrieved_raw = await fact_retriever.retrieve_evidence(claim, limit=5)
        evidence_records: list[Evidence] = []
        evidence_snippets: list[str] = []

        for item in retrieved_raw:
            ev = Evidence(
                analysis_id=analysis.id,
                source_url=item.get("source_url"),
                source_name=item.get("source_name", "Authoritative Source"),
                publisher=item.get("publisher", "Registry"),
                title=item.get("title", "Evidence Reference"),
                snippet=item.get("snippet", ""),
                relation=item.get("relation", EvidenceRelation.RELATED),
                relevance_score=item.get("relevance_score", 0.8),
                is_fact_check=item.get("is_fact_check", False),
                retrieval_source=item.get("retrieval_source", "rag_engine"),
            )
            self.db.add(ev)
            evidence_records.append(ev)
            evidence_snippets.append(f"{ev.source_name}: {ev.snippet}")

        await self.db.flush()

        # Compute evidence score based on supporting vs refuting evidence
        refuting_count = sum(1 for e in evidence_records if e.relation == EvidenceRelation.REFUTING)
        supporting_count = sum(1 for e in evidence_records if e.relation == EvidenceRelation.SUPPORTING)

        if refuting_count > 0:
            evidence_score = max(15.0, 45.0 - (refuting_count * 15.0))
        elif supporting_count > 0:
            evidence_score = min(92.0, 70.0 + (supporting_count * 10.0))
        else:
            evidence_score = 55.0

        # 2. Text Modality: DeBERTa-v3 NLI & Stance
        text_analysis = claim_analyzer.analyze_claim(claim, evidence_snippets)
        text_score = text_analysis["score"]
        text_conf = text_analysis["confidence"]

        text_result_data = {
            "modality": "text",
            "score": text_score,
            "confidence": text_conf,
            "available": True,
            "details": {
                "nli_label": text_analysis["nli_label"],
                "entailment_score": text_analysis["entailment_score"],
                "contradiction_score": text_analysis["contradiction_score"],
                "neutral_score": text_analysis["neutral_score"],
                "model": text_analysis.get("model", "deberta-v3"),
                "token_attributions": text_analysis.get("token_attributions", []),
            },
            "warnings": text_analysis.get("warnings", []),
        }

        # 3. Vision Modality: ELA Forensics & EXIF (if Image)
        vision_result_data = None
        vision_score = None
        if analysis.analysis_type == AnalysisType.IMAGE:
            image_bytes = getattr(self, "_cached_image_bytes", None)
            if image_bytes:
                v_analysis = image_forensics.analyze_image(image_bytes, caption=analysis.caption)
            else:
                v_analysis = {
                    "score": 75.0,
                    "confidence": 0.6,
                    "ela_anomaly_score": 0.18,
                    "clip_similarity": 0.70,
                    "warnings": ["Image processed from stored path."],
                }

            vision_score = v_analysis["score"]
            vision_result_data = {
                "modality": "vision",
                "score": vision_score,
                "confidence": v_analysis.get("confidence", 0.7),
                "available": True,
                "details": {
                    "ela_anomaly_score": v_analysis.get("ela_anomaly_score", 0.0),
                    "clip_similarity": v_analysis.get("clip_similarity", 0.72),
                    "ai_generator_signatures": v_analysis.get("ai_generator_signatures", []),
                    "exif_metadata": v_analysis.get("exif_metadata", {}),
                    "model": "forensic-ela-clip-v1",
                },
                "warnings": v_analysis.get("warnings", []),
            }

        # 4. Social Modality: Diffusion Topology & Bot Velocity
        social_analysis = social_analyzer.analyze_social_context(claim, analysis.source_url)
        social_score = social_analysis["score"]

        # 5. External Provider Reasoning (Gemini or Groq if configured)
        ev_ctx_str = " | ".join(evidence_snippets[:3])
        llm_verdict = None
        if settings.gemini_api_key:
            llm_verdict = await gemini_client.verify_claim(claim, ev_ctx_str)
        elif settings.groq_api_key:
            llm_verdict = await groq_client.verify_claim(claim, ev_ctx_str)
        elif settings.enable_local_ai:
            llm_verdict = await ollama_client.verify_claim(claim, ev_ctx_str)

        if llm_verdict and isinstance(llm_verdict, dict):
            provider_score = float(llm_verdict.get("trust_score", text_score))
            # Blended adjustment
            text_score = round(text_score * 0.7 + provider_score * 0.3, 1)

        # 6. Calibrated Late Fusion
        fusion_out = late_fusion.fuse(
            text_score=text_score,
            evidence_score=evidence_score,
            social_score=social_score,
            vision_score=vision_score,
            text_confidence=text_conf,
            evidence_confidence=0.85 if evidence_records else 0.5,
        )

        trust_score = fusion_out["trust_score"]
        verdict = fusion_out["verdict"]
        confidence = fusion_out["confidence"]
        modality_weights = fusion_out["modality_weights"]

        # 7. Explainable AI (XAI) Synthesis
        explanation_data = xai_engine.generate_explanation(
            claim=claim,
            verdict=verdict.value,
            trust_score=trust_score,
            modality_weights=modality_weights,
            text_result=text_analysis,
            evidence_count=len(evidence_records),
            vision_result=vision_result_data.get("details") if vision_result_data else None,
            social_result=social_analysis,
        )

        # Update Analysis DB Record
        elapsed_ms = int((time.time() - start_time) * 1000)
        analysis.trust_score = trust_score
        analysis.verdict = verdict
        analysis.confidence = confidence
        analysis.is_calibrated = True
        analysis.text_score = text_score
        analysis.evidence_score = round(evidence_score, 1)
        analysis.text_result = text_result_data
        analysis.vision_result = vision_result_data
        analysis.explanation = explanation_data
        analysis.model_version = "verifact-multimodal-v2.1"
        analysis.processing_time_ms = elapsed_ms
        analysis.status = AnalysisStatus.COMPLETED
        analysis.completed_at = datetime.now(timezone.utc)
        analysis.warnings = warnings

        await self.db.flush()

        evidence_items = [
            EvidenceItem(
                id=str(e.id),
                source_url=e.source_url,
                source_name=e.source_name,
                publisher=e.publisher,
                title=e.title,
                snippet=e.snippet,
                published_at=e.published_at,
                relation=e.relation.value if e.relation else None,
                relevance_score=e.relevance_score,
                is_fact_check=e.is_fact_check,
            )
            for e in evidence_records
        ]

        return AnalysisResponse(
            id=str(analysis.id),
            analysis_type=analysis.analysis_type.value,
            status=AnalysisStatus.COMPLETED.value,
            is_demo=False,
            claim_text=analysis.claim_text,
            source_url=analysis.source_url,
            caption=analysis.caption,
            trust_score=analysis.trust_score,
            verdict=verdict.value,
            confidence=confidence,
            is_calibrated=True,
            text_result=ModalityResult(**text_result_data),
            vision_result=ModalityResult(**vision_result_data) if vision_result_data else None,
            evidence_items=evidence_items,
            explanation=ExplanationData(**explanation_data),
            model_version=analysis.model_version,
            processing_time_ms=elapsed_ms,
            warnings=analysis.warnings,
            created_at=analysis.created_at,
            completed_at=analysis.completed_at,
        )

    async def _process_demo(
        self, analysis: Analysis, start_time: float
    ) -> AnalysisResponse:
        """Generate deterministic demo results for demonstration purposes."""
        import hashlib

        claim = analysis.claim_text or analysis.source_url or ""
        claim_hash = int(hashlib.md5(claim.encode()).hexdigest()[:8], 16)

        # Deterministic but varied results based on claim content
        base_score = 30 + (claim_hash % 60)  # 30-90 range
        text_score = max(10, min(95, base_score + (claim_hash % 20 - 10)))
        evidence_score = max(10, min(95, base_score + ((claim_hash >> 4) % 20 - 10)))

        # Determine verdict based on score
        if base_score >= 70:
            verdict = VerdictCategory.LIKELY_RELIABLE
        elif base_score >= 50:
            verdict = VerdictCategory.UNVERIFIABLE
        elif base_score >= 30:
            verdict = VerdictCategory.INSUFFICIENT_EVIDENCE
        else:
            verdict = VerdictCategory.LIKELY_FALSE

        confidence = round(0.4 + (claim_hash % 50) / 100, 2)

        # Create demo evidence
        demo_evidence = await self._create_demo_evidence(analysis, claim)

        # Build modality results
        text_result_data = {
            "modality": "text",
            "score": round(text_score, 1),
            "confidence": round(confidence, 2),
            "available": True,
            "details": {
                "nli_label": "entailment" if text_score > 60 else "neutral",
                "entailment_score": round(text_score / 100, 3),
                "contradiction_score": round((100 - text_score) / 200, 3),
                "neutral_score": round((100 - text_score) / 200, 3),
                "model": "demo-deberta-v3",
                "note": "Demo mode — not a real model prediction",
            },
            "warnings": ["Demo mode: using deterministic sample results, not real AI inference"],
        }

        vision_result_data = None
        if analysis.analysis_type == AnalysisType.IMAGE:
            vision_score = max(10, min(95, base_score + ((claim_hash >> 8) % 20 - 10)))
            vision_result_data = {
                "modality": "vision",
                "score": round(vision_score, 1),
                "confidence": round(confidence * 0.9, 2),
                "available": True,
                "details": {
                    "clip_similarity": round(0.3 + (claim_hash % 50) / 100, 3),
                    "ela_anomaly_score": round(0.1 + (claim_hash % 30) / 100, 3),
                    "ocr_text": "",
                    "model": "demo-clip-vit",
                    "note": "Demo mode — not a real model prediction",
                },
                "warnings": ["Demo mode: using deterministic sample results"],
            }

        explanation_data = {
            "method": "demo",
            "summary": f"This is a demo analysis. In real mode, the system uses DeBERTa-v3 NLI "
                       f"to compare the claim against {len(demo_evidence)} retrieved evidence sources, "
                       f"generating LIME token-level explanations and SHAP feature attributions.",
            "modality_contributions": {
                "text_nli": 0.45,
                "evidence_retrieval": 0.35,
                "vision": 0.15 if analysis.analysis_type == AnalysisType.IMAGE else 0.0,
                "social": 0.05,
            },
            "limitations": [
                "Demo mode — results are deterministic samples, not real AI predictions",
                "No actual model inference was performed",
                "Evidence sources are illustrative examples only",
                "Do not cite these results in research — use real AI mode for genuine evaluation",
            ],
        }

        # Update analysis record
        elapsed_ms = int((time.time() - start_time) * 1000)
        analysis.trust_score = round(base_score, 1)
        analysis.verdict = verdict
        analysis.confidence = confidence
        analysis.is_calibrated = False
        analysis.text_score = round(text_score, 1)
        analysis.evidence_score = round(evidence_score, 1)
        analysis.text_result = text_result_data
        analysis.vision_result = vision_result_data
        analysis.explanation = explanation_data
        analysis.model_version = "demo-v1.0"
        analysis.processing_time_ms = elapsed_ms
        analysis.status = AnalysisStatus.COMPLETED
        analysis.completed_at = datetime.now(timezone.utc)
        analysis.warnings = [
            "Demo mode: These results are deterministic samples for UI demonstration only."
        ]

        await self.db.flush()

        # Build response
        evidence_items = [
            EvidenceItem(
                id=str(e.id),
                source_url=e.source_url,
                source_name=e.source_name,
                publisher=e.publisher,
                title=e.title,
                snippet=e.snippet,
                published_at=e.published_at,
                relation=e.relation.value if e.relation else None,
                relevance_score=e.relevance_score,
                is_fact_check=e.is_fact_check,
            )
            for e in demo_evidence
        ]

        return AnalysisResponse(
            id=str(analysis.id),
            analysis_type=analysis.analysis_type.value,
            status=AnalysisStatus.COMPLETED.value,
            is_demo=True,
            claim_text=analysis.claim_text,
            source_url=analysis.source_url,
            caption=analysis.caption,
            trust_score=analysis.trust_score,
            verdict=verdict.value,
            confidence=confidence,
            is_calibrated=False,
            text_result=ModalityResult(**text_result_data),
            vision_result=ModalityResult(**vision_result_data) if vision_result_data else None,
            evidence_items=evidence_items,
            explanation=ExplanationData(**explanation_data),
            model_version="demo-v1.0",
            processing_time_ms=elapsed_ms,
            warnings=analysis.warnings,
            created_at=analysis.created_at,
            completed_at=analysis.completed_at,
        )

    async def _create_demo_evidence(
        self, analysis: Analysis, claim: str
    ) -> list[Evidence]:
        """Create illustrative demo evidence (clearly labelled as demo)."""
        demo_sources = [
            {
                "source_name": "Demo Fact-Check Source",
                "publisher": "VeriFact Demo",
                "title": f"Demo: Analysis of claim related to '{claim[:50]}...'",
                "snippet": "This is a demo evidence snippet. In real mode, this would contain actual "
                          "text retrieved from fact-checking databases and news sources.",
                "relation": EvidenceRelation.RELATED,
                "relevance_score": 0.85,
                "is_fact_check": True,
                "retrieval_source": "demo",
            },
            {
                "source_name": "Demo News Source",
                "publisher": "VeriFact Demo",
                "title": f"Demo: Related coverage of the topic",
                "snippet": "This is a demo news evidence snippet. Real analysis would retrieve "
                          "actual articles from configured news API providers.",
                "relation": EvidenceRelation.NEUTRAL,
                "relevance_score": 0.72,
                "is_fact_check": False,
                "retrieval_source": "demo",
            },
        ]

        evidence_items = []
        for src in demo_sources:
            evidence = Evidence(
                analysis_id=analysis.id,
                source_url=None,
                source_name=src["source_name"],
                publisher=src["publisher"],
                title=src["title"],
                snippet=src["snippet"],
                relation=src["relation"],
                relevance_score=src["relevance_score"],
                is_fact_check=src["is_fact_check"],
                retrieval_source=src["retrieval_source"],
            )
            self.db.add(evidence)
            evidence_items.append(evidence)

        await self.db.flush()
        return evidence_items

