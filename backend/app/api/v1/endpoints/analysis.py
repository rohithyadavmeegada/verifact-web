"""
VeriFact Backend — Analysis API Endpoints
Text, image, and URL analysis submission and retrieval.
"""

from __future__ import annotations

import uuid
import time
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import (
    User, Analysis, AnalysisType, AnalysisStatus, Evidence, VerdictCategory, Feedback
)
from app.schemas.schemas import (
    TextAnalysisRequest,
    URLAnalysisRequest,
    AnalysisResponse,
    AnalysisStatusResponse,
    AnalysisHistoryItem,
    ModalityResult,
    EvidenceItem,
    ExplanationData,
    FeedbackRequest,
    FeedbackResponse,
)
from app.services.analysis_service import AnalysisService

router = APIRouter(prefix="/analyze", tags=["Analysis"])


@router.post("/text", response_model=AnalysisResponse)
async def analyze_text(
    request: TextAnalysisRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit a text claim for analysis."""
    service = AnalysisService(db)
    analysis = await service.create_analysis(
        user_id=user.id,
        analysis_type=AnalysisType.TEXT,
        claim_text=request.claim,
        is_demo=user.is_demo,
    )

    # Process analysis (sync for now, async with Celery later)
    result = await service.process_analysis(analysis)
    return result


@router.post("/image", response_model=AnalysisResponse)
async def analyze_image(
    image: UploadFile = File(...),
    caption: str = Form(default=""),
    claim: str = Form(default=""),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit an image with optional caption for analysis."""
    # Validate file
    if image.content_type not in ["image/jpeg", "image/png", "image/webp", "image/gif"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image type: {image.content_type}. Supported: JPEG, PNG, WebP, GIF",
        )

    # Check file size (max 10MB)
    content = await image.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image file too large. Maximum size: 10MB",
        )

    # Validate file signature (magic bytes)
    valid_signatures = {
        b"\xff\xd8\xff": "image/jpeg",
        b"\x89PNG": "image/png",
        b"RIFF": "image/webp",
        b"GIF8": "image/gif",
    }
    is_valid = any(content.startswith(sig) for sig in valid_signatures)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image file. File signature does not match declared content type.",
        )

    await image.seek(0)

    service = AnalysisService(db)
    analysis = await service.create_analysis(
        user_id=user.id,
        analysis_type=AnalysisType.IMAGE,
        claim_text=claim or caption,
        caption=caption,
        is_demo=user.is_demo,
        image_data=content,
    )

    result = await service.process_analysis(analysis)
    return result


@router.post("/url", response_model=AnalysisResponse)
async def analyze_url(
    request: URLAnalysisRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit an article URL for analysis."""
    # Basic SSRF prevention
    from urllib.parse import urlparse
    import ipaddress

    parsed = urlparse(request.url)
    hostname = parsed.hostname

    if not hostname:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid URL: no hostname found",
        )

    # Block private/loopback addresses
    blocked_hosts = {"localhost", "127.0.0.1", "0.0.0.0", "::1"}
    if hostname.lower() in blocked_hosts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URLs pointing to local/private addresses are not allowed",
        )

    try:
        ip = ipaddress.ip_address(hostname)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="URLs pointing to private/reserved IP addresses are not allowed",
            )
    except ValueError:
        pass  # Not an IP address, hostname is fine

    # Block cloud metadata endpoints
    metadata_hosts = {"169.254.169.254", "metadata.google.internal"}
    if hostname.lower() in metadata_hosts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Access to cloud metadata endpoints is blocked",
        )

    service = AnalysisService(db)
    analysis = await service.create_analysis(
        user_id=user.id,
        analysis_type=AnalysisType.URL,
        source_url=request.url,
        claim_text=request.claim,
        is_demo=user.is_demo,
    )

    result = await service.process_analysis(analysis)
    return result


@router.get("/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(
    analysis_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a completed analysis by ID."""
    try:
        aid = uuid.UUID(analysis_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid analysis ID format")

    result = await db.execute(
        select(Analysis)
        .where(Analysis.id == aid, Analysis.user_id == user.id)
    )
    analysis = result.scalar_one_or_none()

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    # Fetch evidence
    ev_result = await db.execute(
        select(Evidence).where(Evidence.analysis_id == aid)
    )
    evidence_items = ev_result.scalars().all()

    return _build_analysis_response(analysis, evidence_items)


@router.get("/{analysis_id}/status", response_model=AnalysisStatusResponse)
async def get_analysis_status(
    analysis_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Check analysis processing status."""
    try:
        aid = uuid.UUID(analysis_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid analysis ID format")

    result = await db.execute(
        select(Analysis)
        .where(Analysis.id == aid, Analysis.user_id == user.id)
    )
    analysis = result.scalar_one_or_none()

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    progress_map = {
        AnalysisStatus.PENDING: 0,
        AnalysisStatus.PROCESSING: 10,
        AnalysisStatus.RETRIEVING_EVIDENCE: 25,
        AnalysisStatus.ANALYZING_TEXT: 40,
        AnalysisStatus.ANALYZING_IMAGE: 55,
        AnalysisStatus.ANALYZING_SOCIAL: 65,
        AnalysisStatus.FUSING_RESULTS: 80,
        AnalysisStatus.GENERATING_EXPLANATION: 90,
        AnalysisStatus.COMPLETED: 100,
        AnalysisStatus.FAILED: 100,
    }

    return AnalysisStatusResponse(
        id=str(analysis.id),
        status=analysis.status.value,
        progress=progress_map.get(analysis.status, 0),
        current_step=analysis.status.value.replace("_", " ").title(),
        created_at=analysis.created_at,
    )


@router.post("/{analysis_id}/feedback", response_model=FeedbackResponse)
async def submit_feedback(
    analysis_id: str,
    request: FeedbackRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit human feedback on an analysis verdict for late-fusion calibration."""
    try:
        aid = uuid.UUID(analysis_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid analysis ID format",
        )

    result = await db.execute(select(Analysis).where(Analysis.id == aid))
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis record not found",
        )

    feedback = Feedback(
        user_id=user.id,
        analysis_id=analysis.id,
        rating=request.rating,
        is_correct=request.is_correct,
        comment=request.comment,
    )
    db.add(feedback)
    await db.flush()

    return FeedbackResponse(
        id=str(feedback.id),
        status="success",
        analysis_id=str(feedback.analysis_id),
        rating=feedback.rating,
        is_correct=feedback.is_correct,
        comment=feedback.comment,
        created_at=feedback.created_at or datetime.now(timezone.utc),
    )


def _build_analysis_response(
    analysis: Analysis, evidence_items: list[Evidence]
) -> AnalysisResponse:
    """Build a full analysis response from DB models."""
    evidence_list = [
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
        for e in evidence_items
    ]

    text_result = None
    if isinstance(analysis.text_result, dict):
        text_result = ModalityResult(**analysis.text_result)

    vision_result = None
    if isinstance(analysis.vision_result, dict):
        vision_result = ModalityResult(**analysis.vision_result)

    explanation = None
    if isinstance(analysis.explanation, dict):
        explanation = ExplanationData(**analysis.explanation)

    return AnalysisResponse(
        id=str(analysis.id),
        analysis_type=analysis.analysis_type.value,
        status=analysis.status.value,
        is_demo=analysis.is_demo,
        claim_text=analysis.claim_text,
        source_url=analysis.source_url,
        caption=analysis.caption,
        trust_score=analysis.trust_score,
        verdict=analysis.verdict.value if analysis.verdict else None,
        confidence=analysis.confidence,
        is_calibrated=analysis.is_calibrated,
        text_result=text_result,
        vision_result=vision_result,
        evidence_items=evidence_list,
        explanation=explanation,
        model_version=analysis.model_version,
        processing_time_ms=analysis.processing_time_ms,
        warnings=analysis.warnings or [],
        created_at=analysis.created_at,
        completed_at=analysis.completed_at,
    )
