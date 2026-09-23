import jwt
import pytest

from app.core.security import (
    create_access_token,
    decode_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)


def test_password_hash_roundtrip():
    hashed = hash_password("s3cret-pass")
    assert hashed != "s3cret-pass"
    assert verify_password("s3cret-pass", hashed) is True
    assert verify_password("wrong-pass", hashed) is False


def test_verify_password_handles_malformed_hash():
    assert verify_password("anything", "not-a-valid-argon2-hash") is False


def test_access_token_roundtrip():
    payload = decode_token(create_access_token("42", "admin"))
    assert payload["sub"] == "42"
    assert payload["role"] == "admin"
    assert payload["type"] == "access"


def test_decode_rejects_tampered_token():
    token = create_access_token("1", "staff")
    with pytest.raises(jwt.PyJWTError):
        decode_token(token + "tampered")


def test_refresh_token_hash_is_deterministic_and_opaque():
    raw = generate_refresh_token()
    assert hash_refresh_token(raw) == hash_refresh_token(raw)
    assert raw not in hash_refresh_token(raw)
