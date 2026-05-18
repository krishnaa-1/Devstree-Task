from datetime import datetime, timedelta
from bson import ObjectId
from fastapi import Request
from fastapi.responses import JSONResponse

from app.config.db import get_db
from app.utils.time_utils import convert_to_12_hour, convert_to_minutes, validate_availability_times

def _serialize_value(value):
    if isinstance(value, ObjectId): return str(value)
    if isinstance(value, datetime): return value.isoformat()
    if isinstance(value, dict): return {key: _serialize_value(item) for key, item in value.items()}
    if isinstance(value, list): return [_serialize_value(item) for item in value]
    return value

def _serialize_doc(doc):
    if doc is None: return None
    return _serialize_value(doc)

def _parse_date(date_value):
    if isinstance(date_value, datetime): return date_value
    return datetime.fromisoformat(str(date_value).replace("Z", "+00:00")) if "T" in str(date_value) else datetime.strptime(str(date_value)[:10], "%Y-%m-%d")

def _start_of_day(dt): return datetime(dt.year, dt.month, dt.day)

async def add_availability(request: Request):
    try:
        body = await request.json()
        date = body.get("date")
        start_time = body.get("startTime")
        end_time = body.get("endTime")
        user_id = request.state.user["id"]

        today = datetime.now()
        max_date = today + timedelta(days=7)

        selected_date = _start_of_day(_parse_date(date))
        current_date = _start_of_day(today)
        max_allowed_date = _start_of_day(max_date)

        if selected_date < current_date: return JSONResponse({"error": "Date cannot be in the past."}, status_code=400)
        if selected_date > max_allowed_date: return JSONResponse({"error": "Date cannot be more than 7 days ahead."}, status_code=400)

        start_time, end_time = validate_availability_times(start_time, end_time)
        start_minutes = convert_to_minutes(start_time)
        end_minutes = convert_to_minutes(end_time)
        if start_minutes >= end_minutes:
            return JSONResponse({"error": "Start time must be earlier than end time."}, status_code=400)

        db = get_db()
        availability_doc = {"userId": ObjectId(user_id), "date": _parse_date(date), "startTime": start_time, "endTime": end_time, "status": "Available",
            "createdAt": datetime.utcnow(), "updatedAt": datetime.utcnow()}
        result = await db.availabilities.insert_one(availability_doc)
        availability_doc["_id"] = result.inserted_id

        current = start_minutes
        slots = []
        while current + 30 <= end_minutes:
            slot_start = convert_to_12_hour(current)
            slot_end = convert_to_12_hour(current + 30)
            slots.append({"availabilityId": result.inserted_id, "date": _parse_date(date), "startTime": slot_start, "endTime": slot_end,
                    "status": "Available", "userId": ObjectId(user_id), "createdAt": datetime.utcnow(), "updatedAt": datetime.utcnow()})
            current += 30

        if slots: await db.slots.insert_many(slots)
        return JSONResponse(
            {
                "message": "Availability and slots created successfully.",
                "availability": _serialize_doc(availability_doc),
                "slots": [_serialize_doc(slot) for slot in slots],
            }, status_code=201)
    except ValueError as error:
        return JSONResponse({"error": str(error)}, status_code=400)
    except Exception as error:
        print(f"Error adding availability: {error}")
        return JSONResponse({"error": "Internal server error"}, status_code=500)

async def get_availability(request: Request, date: str):
    try:
        if not date: return JSONResponse({"error": "Invalid date parameter."}, status_code=400)
        try:
            parsed_date = _parse_date(date)
        except ValueError:
            return JSONResponse({"error": "Invalid date parameter."}, status_code=400)

        db = get_db()
        cursor = db.slots.find({"date": parsed_date, "status": "Available"})
        slots = await cursor.to_list(length=None)

        if not slots: return JSONResponse({"message": "No available slots found for this date."}, status_code=404)

        for slot in slots:
            availability = await db.availabilities.find_one({"_id": slot["availabilityId"]})
            user = None
            if availability:
                user = await db.users.find_one({"_id": availability["userId"]}, {"username": 1})
            slot["availabilityId"] = {
                "userId": {
                    "_id": str(user["_id"]) if user else None,
                    "username": user["username"] if user else None,
                }
            }

        slots = [_serialize_doc(slot) for slot in slots]
        slots.sort(key=lambda s: convert_to_minutes(s["startTime"]))

        return JSONResponse({"date": date, "slots": slots})
    except Exception as error:
        print(f"Error fetching availability: {error}")
        return JSONResponse({"error": "Internal server error"}, status_code=500)


async def book_slot(request: Request):
    try:
        body = await request.json()
        date = body.get("date")
        start_time = body.get("startTime")
        user_id = body.get("userId")

        if not date or not start_time or not user_id: return JSONResponse({"error": "Date, startTime, and userId are required."}, status_code=400)

        db = get_db()
        parsed_date = _parse_date(date)

        slot_to_book = await db.slots.find_one(
            {
                "date": parsed_date,
                "startTime": start_time,
                "userId": ObjectId(user_id),
                "status": "Available",
            }
        )
        if not slot_to_book:
            return JSONResponse({"error": "Slot not available for booking."}, status_code=404)

        await db.slots.update_one(
            {"_id": slot_to_book["_id"]},
            {"$set": {"status": "Booked", "updatedAt": datetime.utcnow()}},
        )
        slot_to_book["status"] = "Booked"

        start_minutes = convert_to_minutes(start_time)
        before_start_time = convert_to_12_hour(start_minutes - 30)
        after_start_time = convert_to_12_hour(start_minutes + 30)

        await db.slots.update_many(
            {
                "date": parsed_date,
                "userId": ObjectId(user_id),
                "startTime": {"$in": [before_start_time, after_start_time]},
                "status": "Available",
            },
            {"$set": {"status": "Unavailable", "updatedAt": datetime.utcnow()}},
        )
        return JSONResponse({"message": "Slot booked successfully.", "slot": _serialize_doc(slot_to_book)})
    except Exception as error:
        print(f"Error booking slot: {error}")
        return JSONResponse({"error": "Internal server error"}, status_code=500)
