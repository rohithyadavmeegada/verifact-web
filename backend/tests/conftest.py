"""
VeriFact Backend — Pytest Test Configuration & Fixtures
Initializes database schema for test environments.
"""

import pytest_asyncio
from app.core.database import engine, Base


@pytest_asyncio.fixture(scope="session", autouse=True)
async def initialize_test_database():
    """Ensure database schema and tables exist before any tests run."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
