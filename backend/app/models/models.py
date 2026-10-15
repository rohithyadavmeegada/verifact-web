"""
VeriFact Backend — Database Models
SQLAlchemy models for users, analyses, evidence, experiments, and providers.
Portable across PostgreSQL and SQLite.
"""

import uuid
from datetime import datetime
from enum import Enum as PyEnum
from typing import Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    JSON,
    func,
)
from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB as PG_JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


# ── Portable Types ────────────────────────────────────────────────────────────

class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's UUID type when available, otherwise CHAR(36).
    """
    impl = CHAR(36)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return value
        if not isinstance(value, uuid.UUID):
            return str(uuid.UUID(str(value)))
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(str(value))


JSON_FIELD = JSON().with_variant(PG_JSONB, "postgresql")


# ── Enums ────────────────────────────────────────────────────────────────────

class UserRole(str, PyEnum):
    USER = "user"
    MODERATOR = "moderator"
    ADMIN = "admin"


class AnalysisType(str, PyEnum):
    TEXT = "text"
    IMAGE = "image"
    URL = "url"
    MULTIMODAL = "multimodal"


class AnalysisStatus(str, PyEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    RETRIEVING_EVIDENCE = "retrieving_evidence"
    ANALYZING_TEXT = "analyzing_text"
    ANALYZING_IMAGE = "analyzing_image"
    ANALYZING_SOCIAL = "analyzing_social"
    FUSING_RESULTS = "fusing_results"
    GENERATING_EXPLANATION = "generating_explanation"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class VerdictCategory(str, PyEnum):
    LIKELY_RELIABLE = "likely_reliable"
    UNVERIFIABLE = "unverifiable"
    LIKELY_FALSE = "likely_false"
    SATIRE = "satire"
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"


class EvidenceRelation(str, PyEnum):
    SUPPORTS = "supports"
    SUPPORTING = "supports"
    CONTRADICTS = "contradicts"
    REFUTING = "contradicts"
    NEUTRAL = "neutral"
    RELATED = "related"


class ProviderStatus(str, PyEnum):
    AVAILABLE = "available"
    DEGRADED = "degraded"
    RATE_LIMITED = "rate_limited"
    UNAVAILABLE = "unavailable"
    NOT_CONFIGURED = "not_configured"


class ExperimentStatus(str, PyEnum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


# ── Models ───────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=True)
    avatar_url = Column(String(512), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    provider = Column(String(50), default="google")
    provider_id = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    analyses = relationship("Analysis", back_populates="user", cascade="all, delete-orphan")
    feedbacks = relationship("Feedback", back_populates="user", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_users_provider_id", "provider", "provider_id"),
    )


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    analysis_type = Column(Enum(AnalysisType), nullable=False)
    status = Column(Enum(AnalysisStatus), default=AnalysisStatus.PENDING, nullable=False)
    is_demo = Column(Boolean, default=False)

    # Input
    claim_text = Column(Text, nullable=True)
    image_url = Column(String(1024), nullable=True)
    image_path = Column(String(512), nullable=True)
    source_url = Column(String(2048), nullable=True)
    caption = Column(Text, nullable=True)

    # Results
    trust_score = Column(Float, nullable=True)
    verdict = Column(Enum(VerdictCategory), nullable=True)
    confidence = Column(Float, nullable=True)
    is_calibrated = Column(Boolean, default=False)

    # Modality scores
    text_score = Column(Float, nullable=True)
    vision_score = Column(Float, nullable=True)
    social_score = Column(Float, nullable=True)
    evidence_score = Column(Float, nullable=True)

    # Detailed results
    text_result = Column(JSON_FIELD, nullable=True)
    vision_result = Column(JSON_FIELD, nullable=True)
    social_result = Column(JSON_FIELD, nullable=True)
    fusion_result = Column(JSON_FIELD, nullable=True)
    explanation = Column(JSON_FIELD, nullable=True)

    # Processing metadata
    model_version = Column(String(100), nullable=True)
    processing_time_ms = Column(Integer, nullable=True)
    pipeline_config = Column(JSON_FIELD, nullable=True)
    error_message = Column(Text, nullable=True)
    warnings = Column(JSON_FIELD, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="analyses")
    evidence_items = relationship("Evidence", back_populates="analysis", cascade="all, delete-orphan")
    feedbacks = relationship("Feedback", back_populates="analysis", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_analyses_user_created", "user_id", "created_at"),
        Index("ix_analyses_status", "status"),
        Index("ix_analyses_type", "analysis_type"),
    )


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    analysis_id = Column(GUID, ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False)

    # Source information
    source_url = Column(String(2048), nullable=True)
    source_name = Column(String(255), nullable=True)
    publisher = Column(String(255), nullable=True)
    title = Column(Text, nullable=True)
    snippet = Column(Text, nullable=True)
    full_text = Column(Text, nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    retrieved_at = Column(DateTime(timezone=True), server_default=func.now())

    # Analysis
    relation = Column(Enum(EvidenceRelation), nullable=True)
    relevance_score = Column(Float, nullable=True)
    nli_label = Column(String(50), nullable=True)
    nli_scores = Column(JSON_FIELD, nullable=True)

    # Metadata
    retrieval_source = Column(String(100), nullable=True)
    is_fact_check = Column(Boolean, default=False)
    metadata_ = Column("metadata", JSON_FIELD, nullable=True)

    # Relationships
    analysis = relationship("Analysis", back_populates="evidence_items")

    __table_args__ = (
        Index("ix_evidence_analysis", "analysis_id"),
    )


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    analysis_id = Column(GUID, ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False)

    rating = Column(Integer, nullable=True)
    is_correct = Column(Boolean, nullable=True)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="feedbacks")
    analysis = relationship("Analysis", back_populates="feedbacks")


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    version = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    source_url = Column(String(512), nullable=True)
    license = Column(String(100), nullable=True)
    label_definitions = Column(JSON_FIELD, nullable=True)
    total_records = Column(Integer, nullable=True)
    split_info = Column(JSON_FIELD, nullable=True)
    missing_stats = Column(JSON_FIELD, nullable=True)
    preprocessing_config = Column(JSON_FIELD, nullable=True)
    checksum = Column(String(128), nullable=True)
    is_downloaded = Column(Boolean, default=False)
    prepared_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(ExperimentStatus), default=ExperimentStatus.PENDING)

    # Configuration
    dataset_id = Column(GUID, ForeignKey("datasets.id"), nullable=True)
    model_config = Column(JSON_FIELD, nullable=True)
    hyperparameters = Column(JSON_FIELD, nullable=True)
    pipeline_components = Column(JSON_FIELD, nullable=True)
    config_hash = Column(String(64), nullable=True)
    random_seed = Column(Integer, nullable=True)

    # Results
    metrics = Column(JSON_FIELD, nullable=True)
    confusion_matrix = Column(JSON_FIELD, nullable=True)
    classification_report = Column(JSON_FIELD, nullable=True)
    roc_data = Column(JSON_FIELD, nullable=True)
    calibration_data = Column(JSON_FIELD, nullable=True)
    latency_stats = Column(JSON_FIELD, nullable=True)

    # Metadata
    environment = Column(JSON_FIELD, nullable=True)
    errors = Column(JSON_FIELD, nullable=True)
    warnings = Column(JSON_FIELD, nullable=True)
    artifact_paths = Column(JSON_FIELD, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    dataset = relationship("Dataset")


class ProviderHealth(Base):
    __tablename__ = "provider_health"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    provider_name = Column(String(100), nullable=False, index=True)
    status = Column(Enum(ProviderStatus), nullable=False)
    last_check_at = Column(DateTime(timezone=True), server_default=func.now())
    last_success_at = Column(DateTime(timezone=True), nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    error_count = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    quota_remaining = Column(Integer, nullable=True)
    metadata_ = Column("metadata", JSON_FIELD, nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(100), nullable=True)
    resource_id = Column(String(255), nullable=True)
    details = Column(JSON_FIELD, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(512), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_audit_logs_created", "created_at"),
        Index("ix_audit_logs_user", "user_id"),
    )
