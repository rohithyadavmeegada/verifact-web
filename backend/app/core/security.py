"""
VeriFact Backend — Security Utilities
JWT token management, password hashing, and authentication dependencies.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import get_settings
from app.core.database import get_db
from app.models.models import User, UserRole

settings = get_settings()
security = HTTPBearer(auto_error=False)

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24
DEMO_TOKEN_EXPIRE_HOURS = 2


def create_access_token(
    user_id: str,
    role: str = "user",
    is_demo: bool = False,
    expires_delta: timedelta | None = None,
) -> tuple[str, datetime]:
    """Create a JWT access token."""
    if expires_delta is None:
        hours = DEMO_TOKEN_EXPIRE_HOURS if is_demo else ACCESS_TOKEN_EXPIRE_HOURS
        expires_delta = timedelta(hours=hours)

    expire = datetime.now(timezone.utc) + expires_delta
    to_encode = {
        "sub": user_id,
        "role": role,
        "is_demo": is_demo,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "jti": str(uuid.uuid4()),
    }
    token = jwt.encode(to_encode, settings.app_secret_key, algorithm=ALGORITHM)
    return token, expire


def decode_token(token: str) -> dict:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, settings.app_secret_key, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Get the current authenticated user from JWT token."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return user


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """Get the current user if authenticated, or None for public access."""
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None


def require_role(required_role: UserRole):
    """Dependency factory that requires a specific role."""
    async def role_checker(user: User = Depends(get_current_user)) -> User:
        role_hierarchy = {UserRole.USER: 0, UserRole.MODERATOR: 1, UserRole.ADMIN: 2}
        if role_hierarchy.get(user.role, 0) < role_hierarchy.get(required_role, 0):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required: {required_role.value}",
            )
        return user
    return role_checker
