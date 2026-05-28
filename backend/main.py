from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import connect_db, close_db, get_db
from app.api import auth, patients, therapists, sessions, ml, reports

app = FastAPI(title="SpeakBack", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(therapists.router)
app.include_router(sessions.router)
app.include_router(ml.router)
app.include_router(reports.router)


@app.on_event("startup")
async def startup():
    await connect_db()


@app.on_event("shutdown")
async def shutdown():
    await close_db()


@app.get("/health")
async def health():
    try:
        db = get_db()
        await db.command("ping")
        return {"status": "ok", "db": "connected"}
    except Exception as e:
        return {"status": "ok", "db": f"disconnected: {str(e)}"}
