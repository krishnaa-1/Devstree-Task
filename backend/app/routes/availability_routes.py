from fastapi import APIRouter, Depends, Request

from app.controllers.availability_controller import add_availability, book_slot, get_availability
from app.middleware.auth import protect

router = APIRouter()

@router.post("/availability", dependencies=[Depends(protect("User"))])
async def create_availability(request: Request):
    return await add_availability(request)

@router.get("/availability/{date}", dependencies=[Depends(protect("Admin"))])
async def fetch_availability(request: Request, date: str):
    return await get_availability(request, date)

@router.post("/availability/book", dependencies=[Depends(protect("Admin"))])
async def create_booking(request: Request):
    return await book_slot(request)
