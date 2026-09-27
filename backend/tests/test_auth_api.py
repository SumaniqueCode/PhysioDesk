from app.models.user import UserRole


async def test_login_returns_token_and_sets_refresh_cookie(client, make_user, test_password):
    await make_user("me@test.com", UserRole.admin)

    res = await client.post(
        "/api/v1/auth/login", json={"email": "me@test.com", "password": test_password}
    )

    assert res.status_code == 200
    assert res.json()["access_token"]
    assert "physiodesk_refresh" in res.cookies


async def test_login_rejects_wrong_password(client, make_user):
    await make_user("me@test.com", UserRole.admin)

    res = await client.post(
        "/api/v1/auth/login", json={"email": "me@test.com", "password": "wrong-password"}
    )

    assert res.status_code == 401


async def test_me_requires_authentication(client):
    assert (await client.get("/api/v1/auth/me")).status_code == 401


async def test_me_returns_current_user(client, admin_headers):
    res = await client.get("/api/v1/auth/me", headers=admin_headers)

    assert res.status_code == 200
    assert res.json()["email"] == "admin@test.com"
    assert res.json()["role"] == "admin"
