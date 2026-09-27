async def _create_patient(client, headers, **overrides):
    payload = {"full_name": "Ella Bennett", "email": "ella@example.com", "status": "active"}
    payload.update(overrides)
    return await client.post("/api/v1/patients", json=payload, headers=headers)


async def test_staff_can_create_and_list_patients(client, staff_headers):
    created = await _create_patient(client, staff_headers)
    assert created.status_code == 201
    assert created.json()["full_name"] == "Ella Bennett"

    listed = await client.get("/api/v1/patients", headers=staff_headers)
    assert listed.status_code == 200
    assert listed.json()["total"] == 1


async def test_patient_list_filters_by_status(client, staff_headers):
    await _create_patient(client, staff_headers, full_name="Active One", status="active")
    await _create_patient(client, staff_headers, full_name="Hold One", email=None, status="on_hold")

    res = await client.get("/api/v1/patients?status=on_hold", headers=staff_headers)

    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 1
    assert body["items"][0]["full_name"] == "Hold One"


async def test_get_missing_patient_returns_404(client, staff_headers):
    assert (await client.get("/api/v1/patients/999", headers=staff_headers)).status_code == 404


async def test_future_date_of_birth_is_rejected(client, staff_headers):
    res = await _create_patient(client, staff_headers, date_of_birth="2999-01-01")
    assert res.status_code == 422


async def test_delete_patient(client, staff_headers):
    created = await _create_patient(client, staff_headers)
    patient_id = created.json()["id"]

    deleted = await client.delete(f"/api/v1/patients/{patient_id}", headers=staff_headers)
    assert deleted.status_code == 204
    assert (
        await client.get(f"/api/v1/patients/{patient_id}", headers=staff_headers)
    ).status_code == 404
