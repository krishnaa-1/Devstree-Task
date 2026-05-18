import os
from datetime import datetime, timedelta

import bcrypt
import pytest
from httpx import ASGITransport, AsyncClient

os.environ.setdefault("MONGO_URI", "mongodb://localhost:27017/devstree_test")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret")
os.environ.setdefault("TOKEN_EXPIRY", "1h")

from app.config.db import close_db, connect_db, get_db
from app.main import app

async def _seed_users(db):
    await db.users.delete_many({})
    await db.availabilities.delete_many({})
    await db.slots.delete_many({})

    users = [
        {"username": "admin", "role": "Admin", "password": bcrypt.hashpw(b"admin123", bcrypt.gensalt(8)).decode("utf-8")},
        {"username": "arjunkumar", "role": "User", "password": bcrypt.hashpw(b"user123", bcrypt.gensalt(8)).decode("utf-8")},
        {"username": "nehasharma", "role": "User", "password": bcrypt.hashpw(b"user123", bcrypt.gensalt(8)).decode("utf-8")},
        {"username": "rahulgupta", "role": "User", "password": bcrypt.hashpw(b"user123", bcrypt.gensalt(8)).decode("utf-8")},
    ]
    await db.users.insert_many(users)

@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest.fixture
async def seeded_client():
    await connect_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        db = get_db()
        await _seed_users(db)
        yield ac, db
        await _seed_users(db)
    await close_db()

@pytest.fixture
def today_str():
    return datetime.now().strftime("%Y-%m-%d")

@pytest.fixture
def past_date_str():
    return (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

async def login(client, username, password):
    response = await client.post("/api/auth/login", json={"username": username, "password": password})
    return response
