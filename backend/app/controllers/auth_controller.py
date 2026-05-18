import os
from datetime import datetime, timedelta
import bcrypt
import jwt
from fastapi import Request
from fastapi.responses import JSONResponse, PlainTextResponse
from app.config.db import get_db

def _token_expiry():
    expiry = os.getenv("TOKEN_EXPIRY", "1h")
    if expiry.endswith("h"):
        return datetime.utcnow() + timedelta(hours=int(expiry[:-1]))
    if expiry.endswith("m"):
        return datetime.utcnow() + timedelta(minutes=int(expiry[:-1]))
    if expiry.endswith("d"):
        return datetime.utcnow() + timedelta(days=int(expiry[:-1]))
    return datetime.utcnow() + timedelta(hours=1)

async def login(request: Request):
    body = await request.json()
    username = body.get("username")
    password = body.get("password")

    db = get_db()
    user = await db.users.find_one({"username": username})

    if user:
        stored_password = user["password"]
        if isinstance(stored_password, str):
            stored_password = stored_password.encode("utf-8")
        if bcrypt.checkpw(password.encode("utf-8"), stored_password):
            token = jwt.encode({"id": str(user["_id"]), "role": user["role"], "exp": _token_expiry()}, os.getenv("JWT_SECRET"), algorithm="HS256")
            if isinstance(token, bytes):
                token = token.decode("utf-8")
            return JSONResponse({"token": token, "role": user["role"]})
    return PlainTextResponse("Invalid credentials", status_code=401)
