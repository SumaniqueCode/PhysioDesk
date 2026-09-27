import datetime as dt

from app.models.appointment import Appointment, AppointmentStatus, PaymentMethod
from app.models.patient import Patient
from app.models.therapist import Therapist

_THERAPIST = {
    "full_name": "Dr. Rao",
    "specialty": "Sports",
    "working_days": [0, 1, 2, 3, 4, 5, 6],
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "slot_duration_minutes": 30,
}


def _completed(patient_id, therapist_id, start):
    end = (dt.datetime.combine(dt.date.min, start) + dt.timedelta(minutes=30)).time()
    return Appointment(
        patient_id=patient_id,
        therapist_id=therapist_id,
        date=dt.datetime.now(dt.UTC).date(),
        start_time=start,
        end_time=end,
        status=AppointmentStatus.completed,
        payment_method=PaymentMethod.cash,
    )


async def test_seen_today_counts_distinct_patients(client, admin_headers, db):
    therapist = Therapist(
        specialty="Sports",
        full_name="Dr. Rao",
        working_days=[0, 1, 2, 3, 4],
        start_time=dt.time(9),
        end_time=dt.time(17),
        slot_duration_minutes=30,
    )
    ella = Patient(full_name="Ella")
    owen = Patient(full_name="Owen")
    db.add_all([therapist, ella, owen])
    await db.flush()
    # Ella has two completed visits today; Owen has one. Distinct patients = 2, not 3.
    db.add_all(
        [
            _completed(ella.id, therapist.id, dt.time(9, 0)),
            _completed(ella.id, therapist.id, dt.time(9, 30)),
            _completed(owen.id, therapist.id, dt.time(10, 0)),
        ]
    )
    await db.commit()

    res = await client.get("/api/v1/therapists?seen_today=true", headers=admin_headers)

    assert res.status_code == 200
    item = next(t for t in res.json()["items"] if t["id"] == therapist.id)
    assert item["patients_seen_today"] == 2


async def test_plain_list_omits_seen_today_count(client, admin_headers):
    await client.post("/api/v1/therapists", json=_THERAPIST, headers=admin_headers)

    res = await client.get("/api/v1/therapists", headers=admin_headers)

    assert res.status_code == 200
    # The dropdown path skips the count query and defaults it to zero.
    assert res.json()["items"][0]["patients_seen_today"] == 0


async def test_deactivated_therapist_drops_from_roster(client, admin_headers):
    created = await client.post("/api/v1/therapists", json=_THERAPIST, headers=admin_headers)
    therapist_id = created.json()["id"]

    await client.delete(f"/api/v1/therapists/{therapist_id}", headers=admin_headers)

    active = await client.get("/api/v1/therapists", headers=admin_headers)
    assert active.json()["total"] == 0
    # It is still reachable when explicitly including inactive rows.
    all_rows = await client.get("/api/v1/therapists?is_active=false", headers=admin_headers)
    assert all_rows.json()["total"] == 1
