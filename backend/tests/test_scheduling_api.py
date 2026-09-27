import datetime as dt

# A therapist available every weekday keeps the booking date deterministic.
_THERAPIST = {
    "full_name": "Dr. Rao",
    "specialty": "Sports",
    "working_days": [0, 1, 2, 3, 4, 5, 6],
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "slot_duration_minutes": 30,
}


async def _setup(client, admin_headers):
    therapist = await client.post("/api/v1/therapists", json=_THERAPIST, headers=admin_headers)
    patient = await client.post(
        "/api/v1/patients",
        json={"full_name": "Ella", "email": "ella@example.com"},
        headers=admin_headers,
    )
    tomorrow = (dt.date.today() + dt.timedelta(days=1)).isoformat()
    return therapist.json()["id"], patient.json()["id"], tomorrow


def _booking(patient_id, therapist_id, date, start="09:00:00"):
    return {
        "patient_id": patient_id,
        "therapist_id": therapist_id,
        "date": date,
        "start_time": start,
        "payment_method": "cash",
    }


async def test_availability_lists_open_slots(client, admin_headers):
    therapist_id, _patient_id, date = await _setup(client, admin_headers)

    res = await client.get(
        f"/api/v1/appointments/availability?therapist_id={therapist_id}&date={date}",
        headers=admin_headers,
    )

    assert res.status_code == 200
    starts = [s["start_time"] for s in res.json()["slots"]]
    assert "09:00:00" in starts


async def test_book_appointment_succeeds(client, admin_headers):
    therapist_id, patient_id, date = await _setup(client, admin_headers)

    res = await client.post(
        "/api/v1/appointments",
        json=_booking(patient_id, therapist_id, date),
        headers=admin_headers,
    )

    assert res.status_code == 201
    assert res.json()["end_time"] == "09:30:00"


async def test_double_booking_same_slot_conflicts(client, admin_headers):
    therapist_id, patient_id, date = await _setup(client, admin_headers)
    booking = _booking(patient_id, therapist_id, date)

    first = await client.post("/api/v1/appointments", json=booking, headers=admin_headers)
    assert first.status_code == 201

    second = await client.post("/api/v1/appointments", json=booking, headers=admin_headers)
    assert second.status_code == 409


async def test_booking_off_grid_slot_is_rejected(client, admin_headers):
    therapist_id, patient_id, date = await _setup(client, admin_headers)

    res = await client.post(
        "/api/v1/appointments",
        json=_booking(patient_id, therapist_id, date, start="09:15:00"),
        headers=admin_headers,
    )

    assert res.status_code == 422
