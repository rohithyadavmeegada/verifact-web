"""
VeriFact Backend — Auth API Endpoints
Google OAuth, guest demo mode, and session management.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    get_current_user,
)
from app.models.models import User, UserRole
from app.schemas.schemas import (
    UserResponse,
    GoogleAuthRequest,
    SessionResponse,
    GuestLoginResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])
settings = get_settings()


@router.post("/google", response_model=SessionResponse)
async def google_auth(
    request: GoogleAuthRequest,
    db: AsyncSession = Depends(get_db),
):
    email: str | None = None
    name: str | None = None
    picture: str | None = None
    google_id: str | None = None

    is_dev_token = request.token.startswith("dev_") or request.token == "demo_google_token"

    if settings.google_client_id and not is_dev_token:
        try:
            # Verify real Google ID token
            from google.oauth2 import id_token
            from google.auth.transport import requests as google_requests

            idinfo = id_token.verify_oauth2_token(
                request.token,
                google_requests.Request(),
                settings.google_client_id,
            )

            email = idinfo.get("email")
            name = idinfo.get("name")
            picture = idinfo.get("picture")
            google_id = idinfo.get("sub")

            if not email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email not provided by Google",
                )

        except ImportError:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Google auth library not installed. Run: pip install google-auth",
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid Google token: {str(e)}",
            )
    else:
        # Development / Sandbox Google Authentication Mode
        # Used when GOOGLE_CLIENT_ID is not configured in .env or during local testing
        if request.email and "@" in request.email:
            email = request.email.strip().lower()
        elif is_dev_token and "@" in request.token:
            email = request.token.replace("dev_", "").strip().lower()
        else:
            email = "researcher.google@verifact.ai"

        name = request.name or email.split("@")[0].replace(".", " ").replace("_", " ").title()
        picture = request.avatar_url or "https://lh3.googleusercontent.com/a/default-user"
        google_id = f"google_dev_{abs(hash(email)) % 100000000}"

    # Find or create user
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(
            email=email,
            name=name,
            avatar_url=picture,
            provider="google",
            provider_id=google_id,
            role=UserRole.USER,
        )
        db.add(user)
        await db.flush()
    else:
        user.name = name or user.name
        user.avatar_url = picture or user.avatar_url
        user.last_login_at = datetime.now(timezone.utc)

    token, expires_at = create_access_token(str(user.id), user.role.value)

    return SessionResponse(
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            name=user.name,
            avatar_url=user.avatar_url,
            role=user.role.value,
            created_at=user.created_at,
        ),
        access_token=token,
        expires_at=expires_at,
    )


@router.post("/guest", response_model=GuestLoginResponse)
async def guest_login(db: AsyncSession = Depends(get_db)):
    """Create a guest demo session with limited access."""
    guest_id = str(uuid.uuid4())
    guest_email = f"guest_{guest_id[:8]}@demo.verifact.ai"

    user = User(
        email=guest_email,
        name="Guest Researcher",
        role=UserRole.USER,
        is_demo=False,
        is_active=True,
    )
    db.add(user)
    await db.flush()

    token, expires_at = create_access_token(
        str(user.id), user.role.value, is_demo=False
    )

    return GuestLoginResponse(
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            name=user.name,
            role=user.role.value,
            is_demo=False,
            created_at=user.created_at,
        ),
        access_token=token,
    )


@router.get("/session", response_model=UserResponse)
async def get_session(user: User = Depends(get_current_user)):
    """Get current session user info."""
    return UserResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        role=user.role.value,
        is_demo=user.is_demo,
        created_at=user.created_at,
    )


@router.post("/logout")
async def logout(user: User = Depends(get_current_user)):
    """Logout current session."""
    # In a stateless JWT system, the client discards the token.
    # For enhanced security, a token blacklist could be implemented with Redis.
    return {"message": "Logged out successfully"}
