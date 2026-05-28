import re
from fastapi import APIRouter, HTTPException, Depends
from app.models.patient import PatientProfileCreate, PatientProfileOut, PatientProfilePatch
from app.api.deps import get_current_user
from app.db.database import get_db

router = APIRouter(prefix="/patients", tags=["patients"])


def _profile_out(user, profile) -> PatientProfileOut:
    return PatientProfileOut(
        patient_id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        diagnosis_date=profile["diagnosis_date"],
        affected_side=profile["affected_side"],
        therapist_id=profile.get("therapist_id"),
        notes=profile.get("notes"),
        focus_sounds=profile.get("focus_sounds", ["P", "B"]),
        level=profile.get("level", 1),
        words_per_session=profile.get("words_per_session", 5),
        phrases_per_session=profile.get("phrases_per_session", 3),
        promotion_flag=profile.get("promotion_flag", False),
    )


@router.post("/profile", response_model=PatientProfileOut)
async def create_profile(data: PatientProfileCreate, current_user=Depends(get_current_user)):
    if current_user["role"] != "patient":
        raise HTTPException(status_code=403, detail="Only patients can create a patient profile")

    db = get_db()
    user_id = str(current_user["_id"])

    existing = await db.patient_profiles.find_one({"patient_id": user_id})
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")

    therapist_id = None
    if data.therapist_name:
        pattern = re.compile(f"^{re.escape(data.therapist_name.strip())}$", re.IGNORECASE)
        therapist_user = await db.users.find_one({"name": pattern, "role": "therapist"})
        if not therapist_user:
            raise HTTPException(
                status_code=404,
                detail=f"No therapist named '{data.therapist_name}' found. Check the spelling and try again.",
            )
        therapist_id = str(therapist_user["_id"])
        await db.therapist_profiles.update_one(
            {"therapist_id": therapist_id},
            {"$addToSet": {"patient_ids": user_id}},
        )

    doc = {
        "patient_id": user_id,
        "diagnosis_date": data.diagnosis_date,
        "affected_side": data.affected_side,
        "therapist_id": therapist_id,
        "notes": data.notes,
        "focus_sounds": data.focus_sounds,
        "level": data.level,
        "words_per_session": data.words_per_session,
        "phrases_per_session": data.phrases_per_session,
        "promotion_flag": False,
    }
    await db.patient_profiles.insert_one(doc)
    return _profile_out(current_user, doc)


@router.get("/profile", response_model=PatientProfileOut)
async def get_my_profile(current_user=Depends(get_current_user)):
    if current_user["role"] != "patient":
        raise HTTPException(status_code=403, detail="Patients only")

    db = get_db()
    user_id = str(current_user["_id"])
    profile = await db.patient_profiles.find_one({"patient_id": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return _profile_out(current_user, profile)


@router.patch("/profile", response_model=PatientProfileOut)
async def patch_profile(data: PatientProfilePatch, current_user=Depends(get_current_user)):
    if current_user["role"] not in ("patient", "therapist"):
        raise HTTPException(status_code=403, detail="Not allowed")

    db = get_db()
    user_id = str(current_user["_id"])

    if current_user["role"] == "therapist":
        raise HTTPException(status_code=403, detail="Use therapist patient endpoint to patch a patient's profile")

    profile = await db.patient_profiles.find_one({"patient_id": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if updates:
        await db.patient_profiles.update_one({"patient_id": user_id}, {"$set": updates})
        profile.update(updates)

    return _profile_out(current_user, profile)


@router.patch("/profile/{patient_id}", response_model=dict)
async def therapist_patch_patient_profile(patient_id: str, data: PatientProfilePatch, current_user=Depends(get_current_user)):
    if current_user["role"] != "therapist":
        raise HTTPException(status_code=403, detail="Therapists only")

    db = get_db()
    profile = await db.patient_profiles.find_one({"patient_id": patient_id})
    if not profile:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if updates:
        await db.patient_profiles.update_one({"patient_id": patient_id}, {"$set": updates})

    return {"updated": True, "fields": list(updates.keys())}
