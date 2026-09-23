import pytest

from app.core.deps import require_roles
from app.core.exceptions import PermissionDeniedError
from app.models.user import User, UserRole


def _user(role: UserRole) -> User:
    return User(id=1, email="a@b.com", full_name="A", password_hash="x", role=role, is_active=True)


async def test_require_roles_allows_matching_role():
    checker = require_roles(UserRole.admin)
    user = _user(UserRole.admin)
    assert await checker(user) is user


async def test_require_roles_rejects_other_role():
    checker = require_roles(UserRole.admin)
    with pytest.raises(PermissionDeniedError):
        await checker(_user(UserRole.staff))
