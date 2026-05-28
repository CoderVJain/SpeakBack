from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response
from datetime import datetime, timedelta
from bson import ObjectId
from app.api.deps import get_current_user
from app.db.database import get_db
from app.services.report_generator import generate_weekly_report
from app.services.storage import upload_report

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/{patient_id}/generate")
async def generate_report(patient_id: str, week: str = "previous", current_user=Depends(get_current_user)):
    if current_user["role"] != "therapist":
        raise HTTPException(status_code=403, detail="Therapists only")

    db = get_db()
    patient = await db.users.find_one({"_id": ObjectId(patient_id)})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    this_monday = (datetime.utcnow() - timedelta(days=datetime.utcnow().weekday())).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    if week == "current":
        week_start = this_monday
        week_end = this_monday + timedelta(days=7)
        is_current_week = True
    else:
        week_start = this_monday - timedelta(days=7)
        week_end = this_monday
        is_current_week = False

    cursor = db.sessions.find({
        "patient_id": patient_id,
        "timestamp": {"$gte": week_start.isoformat(), "$lt": week_end.isoformat()},
    })
    sessions = []
    async for s in cursor:
        sessions.append(s)

    pdf_bytes = generate_weekly_report(
        patient_name=patient["name"],
        patient_id=patient_id,
        week_start=week_start.isoformat(),
        sessions=sessions,
        is_current_week=is_current_week,
    )

    date_str = week_start.strftime("%Y-%m-%d")
    pdf_url = upload_report(pdf_bytes, patient_id, date_str)

    await db.reports.update_one(
        {"patient_id": patient_id, "week_start": week_start.isoformat()},
        {"$set": {
            "therapist_id": str(current_user["_id"]),
            "pdf_url": pdf_url,
            "session_count": len(sessions),
            "created_at": datetime.utcnow().isoformat(),
            "is_current_week": is_current_week,
        }},
        upsert=True,
    )

    return {
        "pdf_url": pdf_url,
        "session_count": len(sessions),
        "week_start": date_str,
        "is_current_week": is_current_week,
    }


@router.get("/{patient_id}")
async def get_reports(patient_id: str, current_user=Depends(get_current_user)):
    if current_user["role"] not in ["therapist", "patient"]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    db = get_db()
    cursor = db.reports.find({"patient_id": patient_id}).sort("week_start", -1)
    reports = []
    async for r in cursor:
        reports.append({
            "week_start": r["week_start"],
            "pdf_url": r["pdf_url"],
            "session_count": r["session_count"],
            "created_at": r["created_at"],
            "is_current_week": r.get("is_current_week", False),
        })
    return reports


@router.get("/{patient_id}/download")
async def download_report(patient_id: str, week_start: str, current_user=Depends(get_current_user)):
    db = get_db()
    report = await db.reports.find_one({"patient_id": patient_id, "week_start": {"$regex": week_start}})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"pdf_url": report["pdf_url"]}
