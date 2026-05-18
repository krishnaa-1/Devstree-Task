from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

from app.config.db import close_db, connect_db
from app.middleware.auth import PlainHTTPException
from app.routes.auth_routes import router as auth_router
from app.routes.availability_routes import router as availability_router

load_dotenv()
@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()

app = FastAPI(lifespan=lifespan)

@app.exception_handler(PlainHTTPException)
async def plain_http_exception_handler(request, exc):
    return PlainTextResponse(exc.content, status_code=exc.status_code)

app.add_middleware(CORSMiddleware, allow_origin_regex=".*", allow_credentials=True, allow_methods=["GET", "POST", "PUT", "DELETE"], allow_headers=["Content-Type", "Authorization"])
app.include_router(auth_router, prefix="/api/auth")
app.include_router(availability_router, prefix="/api")

@app.get("/api/health")
async def health(): return {"status": "ok"}
