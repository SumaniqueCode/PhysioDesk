THERAPIST = {
    "full_name": "Dr. Rao",
    "specialty": "Sports",
    "working_days": [0, 1, 2, 3, 4, 5, 6],
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "slot_duration_minutes": 30,
}


async def test_therapist_write_requires_authentication(client):
    assert (await client.post("/api/v1/therapists", json=THERAPIST)).status_code == 401


async def test_staff_cannot_create_therapist(client, staff_headers):
    res = await client.post("/api/v1/therapists", json=THERAPIST, headers=staff_headers)
    assert res.status_code == 403


async def test_admin_can_create_therapist(client, admin_headers):
    res = await client.post("/api/v1/therapists", json=THERAPIST, headers=admin_headers)
    assert res.status_code == 201
    assert res.json()["full_name"] == "Dr. Rao"


async def test_staff_can_read_therapists(client, admin_headers, staff_headers):
    await client.post("/api/v1/therapists", json=THERAPIST, headers=admin_headers)
    res = await client.get("/api/v1/therapists", headers=staff_headers)
    assert res.status_code == 200
    assert res.json()["total"] == 1
