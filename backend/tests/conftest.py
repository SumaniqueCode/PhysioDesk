import os

# Hermetic settings so the suite imports app.core.config without a real backend/.env.
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://test:test@localhost:5432/physiodesk_test")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret-that-is-at-least-32-characters-long")
