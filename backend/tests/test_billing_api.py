async def _patient(client, headers):
    res = await client.post(
        "/api/v1/patients",
        json={"full_name": "Ella", "email": "ella@example.com"},
        headers=headers,
    )
    return res.json()["id"]


def _invoice(patient_id, **overrides):
    payload = {
        "patient_id": patient_id,
        "service": "Initial assessment",
        "amount": "120.00",
        "discount": "0.00",
        "status": "due",
        "payment_method": "card",
    }
    payload.update(overrides)
    return payload


async def test_staff_cannot_create_invoice(client, admin_headers, staff_headers):
    patient_id = await _patient(client, admin_headers)
    res = await client.post("/api/v1/invoices", json=_invoice(patient_id), headers=staff_headers)
    assert res.status_code == 403


async def test_admin_creates_invoice_with_computed_total(client, admin_headers):
    patient_id = await _patient(client, admin_headers)

    res = await client.post(
        "/api/v1/invoices",
        json=_invoice(patient_id, amount="120.00", discount="20.00"),
        headers=admin_headers,
    )

    assert res.status_code == 201
    assert res.json()["total"] == "100.00"


async def test_discount_exceeding_amount_is_rejected(client, admin_headers):
    patient_id = await _patient(client, admin_headers)

    res = await client.post(
        "/api/v1/invoices",
        json=_invoice(patient_id, amount="50.00", discount="80.00"),
        headers=admin_headers,
    )

    assert res.status_code == 422


async def test_marking_invoice_paid_stamps_paid_at(client, admin_headers):
    patient_id = await _patient(client, admin_headers)
    created = await client.post(
        "/api/v1/invoices", json=_invoice(patient_id), headers=admin_headers
    )
    invoice_id = created.json()["id"]
    assert created.json()["paid_at"] is None

    updated = await client.patch(
        f"/api/v1/invoices/{invoice_id}", json={"status": "paid"}, headers=admin_headers
    )

    assert updated.status_code == 200
    assert updated.json()["paid_at"] is not None
