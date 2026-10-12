"""
VeriFact Backend — Pydantic Schemas
Request/response validation for all API endpoints.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, Field, HttpUrl, field_validator, ConfigDict


# ── Common ───────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "1.0.0"
    timestamp: datetime
    database: str = "connected"
    redis: str = "connected"
    demo_mode: bool = True


class PaginatedResponse(BaseModel):
    items: list[Any]
    total: int
    page: int
    page_size: int
    total_pages: int


class ErrorResponse(BaseModel):
    error: str
    detail: str | None = None
    request_id: str | None = None


# ── Auth ─────────────────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    name: str | None = None
    avatar_url: str | None = None
    role: str
    is_demo: bool = False
    created_at: datetime | None = None


class GoogleAuthRequest(BaseModel):
    token: str = Field(..., description="Google OAuth ID token")


class SessionResponse(BaseModel):
    user: UserResponse
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime


class GuestLoginResponse(BaseModel):
    user: UserResponse
    access_token: str
    token_type: str = "bearer"
    message: str = "Guest demo session created. Some features are limited."


# ── Analysis ─────────────────────────────────────────────────────────────────

class AnalysisTypeEnum(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    URL = "url"


class TextAnalysisRequest(BaseModel):
    claim: str = Field(..., min_length=10, max_length=5000, description="The claim to analyze")
    context: str | None = Field(None, max_length=2000, description="Additional context")

    @field_validator("claim")
    @classmethod
    def clean_claim(cls, v: str) -> str:
        return v.strip()


class ImageAnalysisRequest(BaseModel):
    caption: str | None = Field(None, max_length=2000, description="Image caption or claim")
    claim: str | None = Field(None, max_length=5000, description="Claim about the image")


class URLAnalysisRequest(BaseModel):
    url: str = Field(..., max_length=2048, description="Article URL to analyze")
    claim: str | None = Field(None, max_length=5000, description="Specific claim to verify")

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        v = v.strip()
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v


class AnalysisStatusResponse(BaseModel):
    id: str
    status: str
    progress: float = 0.0
    current_step: str | None = None
    created_at: datetime
    estimated_completion: datetime | None = None


class ModalityResult(BaseModel):
    modality: str
    score: float | None = None
    confidence: float | None = None
    available: bool = True
    details: dict[str, Any] = {}
    warnings: list[str] = []


class EvidenceItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    source_url: str | None = None
    source_name: str | None = None
    publisher: str | None = None
    title: str | None = None
    snippet: str | None = None
    published_at: datetime | None = None
    relation: str | None = None
    relevance_score: float | None = None
    is_fact_check: bool = False


class ExplanationData(BaseModel):
    method: str  # "lime", "shap", "rule_based", "none"
    summary: str
    token_attributions: list[dict[str, Any]] | None = None
    feature_importance: list[dict[str, Any]] | None = None
    evidence_reasoning: list[dict[str, Any]] | None = None
    modality_contributions: dict[str, float] | None = None
    limitations: list[str] = []


class AnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    analysis_type: str
    status: str
    is_demo: bool = False

    # Input
    claim_text: str | None = None
    source_url: str | None = None
    caption: str | None = None

    # Results
    trust_score: float | None = None
    verdict: str | None = None
    confidence: float | None = None
    is_calibrated: bool = False

    # Modality results
    text_result: ModalityResult | None = None
    vision_result: ModalityResult | None = None
    social_result: ModalityResult | None = None
    evidence_result: ModalityResult | None = None
    fusion_result: dict[str, Any] | None = None

    # Evidence
    evidence_items: list[EvidenceItem] = []

    # Explanation
    explanation: ExplanationData | None = None

    # Metadata
    model_version: str | None = None
    processing_time_ms: int | None = None
    warnings: list[str] = []
    created_at: datetime | None = None
    completed_at: datetime | None = None


class AnalysisHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    analysis_type: str
    status: str
    claim_text: str | None = None
    trust_score: float | None = None
    verdict: str | None = None
    is_demo: bool = False
    created_at: datetime | None = None


# ── Feedback ─────────────────────────────────────────────────────────────────

class FeedbackRequest(BaseModel):
    analysis_id: str
    rating: int | None = Field(None, ge=1, le=5)
    is_correct: bool | None = None
    comment: str | None = Field(None, max_length=1000)


class FeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    analysis_id: str
    rating: int | None = None
    is_correct: bool | None = None
    comment: str | None = None
    created_at: datetime


# ── Research ─────────────────────────────────────────────────────────────────

class DatasetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    version: str | None = None
    description: str | None = None
    source_url: str | None = None
    license: str | None = None
    total_records: int | None = None
    is_downloaded: bool = False
    split_info: dict | None = None
    label_definitions: dict | None = None


class ExperimentCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    dataset_id: str | None = None
    pipeline_components: list[str] = []
    hyperparameters: dict[str, Any] = {}
    random_seed: int | None = 42


class ExperimentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str | None = None
    status: str
    dataset_id: str | None = None
    pipeline_components: dict | None = None
    hyperparameters: dict | None = None
    metrics: dict | None = None
    confusion_matrix: list | None = None
    created_at: datetime | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None


# ── Provider Health ──────────────────────────────────────────────────────────

class ProviderHealthResponse(BaseModel):
    provider_name: str
    status: str
    is_configured: bool
    last_check_at: datetime | None = None
    last_success_at: datetime | None = None
    response_time_ms: int | None = None
    error_count: int = 0
    capabilities: list[str] = []
    fallback_available: bool = False


class ProviderTestResponse(BaseModel):
    provider_name: str
    success: bool
    response_time_ms: int | None = None
    message: str
