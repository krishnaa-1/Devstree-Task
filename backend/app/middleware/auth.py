import os
from typing import Callable
import jwt
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

security = HTTPBearer(auto_error=False)

class PlainHTTPException(Exception):
    def __init__(self, status_code: int, content: str):
        self.status_code = status_code
        self.content = content

def protect(role: str) -> Callable:
    async def dependency(
        request: Request,
        credentials: HTTPAuthorizationCredentials = Depends(security)):
        token = credentials.credentials if credentials else None
        if not token:
            raise PlainHTTPException(401, "Access denied")

        try:
            decoded = jwt.decode(token, os.getenv("JWT_SECRET"), algorithms=["HS256"])
            if decoded.get("role") != role and role != "Any":
                raise PlainHTTPException(403, "Forbidden")
            request.state.user = decoded
        except PlainHTTPException:
            raise
        except jwt.PyJWTError:
            raise PlainHTTPException(401, "Invalid token")

    return dependency
