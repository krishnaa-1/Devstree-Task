import os
from motor.motor_asyncio import AsyncIOMotorClient

_client = None
_db = None

async def connect_db():
    global _client, _db

    if _db is not None: return _db
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri: raise RuntimeError("MONGO_URI is not defined")

    _client = AsyncIOMotorClient(mongo_uri)
    _db = _client.get_default_database()
    print("MongoDB connected")
    return _db

async def close_db():
    global _client, _db

    if _client is not None:
        _client.close()
        _client = None
        _db = None

def get_db():
    if _db is None:
        raise RuntimeError("Database is not connected")
    return _db
