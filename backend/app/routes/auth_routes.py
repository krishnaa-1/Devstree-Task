from fastapi import APIRouter, Request
from app.controllers.auth_controller import login

router = APIRouter()

@router.post("/login")
async def auth_login(request: Request):
    return await login(request)
