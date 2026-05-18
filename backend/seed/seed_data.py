import asyncio
import os
import sys
import bcrypt
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()
async def populate():
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri: print("MONGO_URI is not defined"); sys.exit(1)

    client = AsyncIOMotorClient(mongo_uri)
    db = client.get_default_database()
    try:
        print("Database connected successfully.")
        await db.users.delete_many({})
        print("Existing users cleared.")

        users = [
            {"username": "admin", "role": "Admin", "password": bcrypt.hashpw(b"admin123", bcrypt.gensalt(8)).decode("utf-8")},
            {"username": "arjunkumar", "role": "User", "password": bcrypt.hashpw(b"user123", bcrypt.gensalt(8)).decode("utf-8")},
            {"username": "nehasharma", "role": "User", "password": bcrypt.hashpw(b"user123", bcrypt.gensalt(8)).decode("utf-8")},
            {"username": "rahulgupta", "role": "User", "password": bcrypt.hashpw(b"user123", bcrypt.gensalt(8)).decode("utf-8")},
        ]
        await db.users.insert_many(users)
        print("Admin and users populated successfully.")
    except Exception as error: print(f"Error populating users: {error}")
    finally: client.close()

if __name__ == "__main__":
    asyncio.run(populate())
