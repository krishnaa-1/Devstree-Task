from datetime import datetime, timedelta
import pytest
from tests.conftest import login

@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

@pytest.mark.asyncio
async def test_login_invalid_credentials(seeded_client):
    client, _ = seeded_client
    response = await login(client, "admin", "wrongpassword")
    assert response.status_code == 401
    assert response.text == "Invalid credentials"

@pytest.mark.asyncio
async def test_login_admin_success(seeded_client):
    client, _ = seeded_client
    response = await login(client, "admin", "admin123")
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert data["role"] == "Admin"

@pytest.mark.asyncio
async def test_login_user_success(seeded_client):
    client, _ = seeded_client
    response = await login(client, "arjunkumar", "user123")
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert data["role"] == "User"

@pytest.mark.asyncio
async def test_protected_route_without_token(seeded_client, today_str):
    client, _ = seeded_client
    response = await client.get(f"/api/availability/{today_str}")
    assert response.status_code == 401
    assert response.text == "Access denied"

@pytest.mark.asyncio
async def test_protected_route_wrong_role(seeded_client, today_str):
    client, _ = seeded_client
    user_login = await login(client, "arjunkumar", "user123")
    token = user_login.json()["token"]
    response = await client.get(f"/api/availability/{today_str}", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403
    assert response.text == "Forbidden"

@pytest.mark.asyncio
async def test_add_availability_past_date(seeded_client, past_date_str):
    client, _ = seeded_client
    user_login = await login(client, "arjunkumar", "user123")
    token = user_login.json()["token"]
    response = await client.post("/api/availability", json={"date": past_date_str, "startTime": "9:00 AM", "endTime": "10:00 AM"}, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 400
    assert response.json()["error"] == "Date cannot be in the past."

@pytest.mark.asyncio
async def test_add_availability_beyond_seven_days(seeded_client):
    client, _ = seeded_client
    user_login = await login(client, "arjunkumar", "user123")
    token = user_login.json()["token"]
    far_date = (datetime.now() + timedelta(days=8)).strftime("%Y-%m-%d")
    response = await client.post("/api/availability", json={"date": far_date, "startTime": "9:00 AM", "endTime": "10:00 AM"}, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 400
    assert response.json()["error"] == "Date cannot be more than 7 days ahead."

@pytest.mark.asyncio
async def test_add_availability_invalid_time_range(seeded_client, today_str):
    client, _ = seeded_client
    user_login = await login(client, "arjunkumar", "user123")
    token = user_login.json()["token"]
    response = await client.post("/api/availability", json={"date": today_str, "startTime": "11:00 AM", "endTime": "10:00 AM"}, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 400
    assert response.json()["error"] == "Start time must be earlier than end time."

@pytest.mark.asyncio
async def test_full_availability_and_booking_flow(seeded_client, today_str):
    client, db = seeded_client
    user_login = await login(client, "arjunkumar", "user123")
    user_token = user_login.json()["token"]

    user_doc = await db.users.find_one({"username": "arjunkumar"})
    user_id = str(user_doc["_id"])

    add_response = await client.post("/api/availability", json={"date": today_str, "startTime": "9:00 AM", "endTime": "11:00 AM"}, headers={"Authorization": f"Bearer {user_token}"})
    assert add_response.status_code == 201
    add_data = add_response.json()
    assert add_data["message"] == "Availability and slots created successfully."
    assert len(add_data["slots"]) == 4

    admin_login = await login(client, "admin", "admin123")
    admin_token = admin_login.json()["token"]

    get_response = await client.get(f"/api/availability/{today_str}", headers={"Authorization": f"Bearer {admin_token}"})
    assert get_response.status_code == 200
    slots = get_response.json()["slots"]
    assert len(slots) == 4
    assert slots[0]["startTime"] == "9:00 AM"
    assert slots[0]["availabilityId"]["userId"]["username"] == "arjunkumar"

    book_response = await client.post("/api/availability/book", json={"date": today_str, "startTime": "9:30 AM", "userId": user_id}, headers={"Authorization": f"Bearer {admin_token}"})
    assert book_response.status_code == 200
    assert book_response.json()["message"] == "Slot booked successfully."
    assert book_response.json()["slot"]["status"] == "Booked"

    booked_slot = await db.slots.find_one({"startTime": "9:30 AM", "userId": user_doc["_id"]})
    assert booked_slot["status"] == "Booked"

    before_slot = await db.slots.find_one({"startTime": "9:00 AM", "userId": user_doc["_id"]})
    after_slot = await db.slots.find_one({"startTime": "10:00 AM", "userId": user_doc["_id"]})
    assert before_slot["status"] == "Unavailable"
    assert after_slot["status"] == "Unavailable"

    edge_slot = await db.slots.find_one({"startTime": "10:30 AM", "userId": user_doc["_id"]})
    assert edge_slot["status"] == "Available"

@pytest.mark.asyncio
async def test_get_availability_no_slots(seeded_client, today_str):
    client, _ = seeded_client
    admin_login = await login(client, "admin", "admin123")
    admin_token = admin_login.json()["token"]
    response = await client.get(f"/api/availability/{today_str}", headers={"Authorization": f"Bearer {admin_token}"},)
    assert response.status_code == 404
    assert response.json()["message"] == "No available slots found for this date."

@pytest.mark.asyncio
async def test_book_unavailable_slot(seeded_client, today_str):
    client, db = seeded_client
    user_login = await login(client, "arjunkumar", "user123")
    user_token = user_login.json()["token"]
    user_doc = await db.users.find_one({"username": "arjunkumar"})
    user_id = str(user_doc["_id"])

    await client.post("/api/availability", json={"date": today_str, "startTime": "2:00 PM", "endTime": "3:00 PM"}, headers={"Authorization": f"Bearer {user_token}"})
    admin_login = await login(client, "admin", "admin123")
    admin_token = admin_login.json()["token"]

    response = await client.post("/api/availability/book", json={"date": today_str, "startTime": "4:00 PM", "userId": user_id}, headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 404
    assert response.json()["error"] == "Slot not available for booking."

@pytest.mark.asyncio
async def test_book_slot_missing_fields(seeded_client):
    client, _ = seeded_client
    admin_login = await login(client, "admin", "admin123")
    admin_token = admin_login.json()["token"]
    response = await client.post("/api/availability/book", json={"date": "2026-05-18"}, headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 400
    assert response.json()["error"] == "Date, startTime, and userId are required."
